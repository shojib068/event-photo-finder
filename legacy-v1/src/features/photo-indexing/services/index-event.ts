import type { DriveImageFile } from '@/core/storage';
import type { DetectedFace } from '@/shared/face-provider';
import type { EventRecord } from '@/shared/events';
import { BACKOFF_BASE_MS, MAX_PHOTO_ATTEMPTS } from '../constants';
import type { PendingPhoto } from '../types';
import { filterIndexableFaces, isSupportedImage } from './face-filter';

export interface IndexDeps {
  listImages(folderId: string): Promise<DriveImageFile[]>;
  download(fileId: string): Promise<Buffer>;
  detectAndEmbed(image: Buffer): Promise<DetectedFace[]>;
  upsertPhotos(eventId: string, files: DriveImageFile[]): Promise<void>;
  listPendingPhotos(eventId: string): Promise<PendingPhoto[]>;
  saveFaces(eventId: string, photoId: string, faces: DetectedFace[]): Promise<void>;
  markPhoto(eventId: string, photoId: string, status: 'skipped' | 'failed', attempts: number): Promise<void>;
  finishEvent(eventId: string): Promise<void>;
  onPhotoError(photoId: string, err: unknown): void;
  sleep(ms: number): Promise<void>;
  concurrency: number;
}

async function indexPhoto(deps: IndexDeps, eventId: string, photo: PendingPhoto): Promise<void> {
  if (!isSupportedImage(photo.mimeType)) {
    await deps.markPhoto(eventId, photo.id, 'skipped', photo.attempts);
    return;
  }
  let attempts = photo.attempts;
  while (attempts < MAX_PHOTO_ATTEMPTS) {
    try {
      const bytes = await deps.download(photo.driveFileId);
      const faces = filterIndexableFaces(await deps.detectAndEmbed(bytes));
      await deps.saveFaces(eventId, photo.id, faces);
      return;
    } catch (err) {
      attempts += 1;
      deps.onPhotoError(photo.id, err);
      if (attempts < MAX_PHOTO_ATTEMPTS) await deps.sleep(BACKOFF_BASE_MS * 2 ** (attempts - 1));
    }
  }
  await deps.markPhoto(eventId, photo.id, 'failed', attempts);
}

/** Simple worker pool over the pending photos. */
async function runPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

/** Lists the folder, indexes every pending photo, then marks the event ready (or failed). */
export async function indexEvent(deps: IndexDeps, event: EventRecord): Promise<void> {
  const files = await deps.listImages(event.driveFolderId);
  await deps.upsertPhotos(event.id, files);
  const pending = await deps.listPendingPhotos(event.id);
  await runPool(pending, deps.concurrency, (photo) => indexPhoto(deps, event.id, photo));
  await deps.finishEvent(event.id);
}
