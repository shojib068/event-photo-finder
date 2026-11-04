import { FACE_MODEL_ID, DESCRIPTOR_LENGTH } from '../../src/shared/face-engine';
import { FACE_INDEX_VERSION, type FaceIndex, type IndexedPhoto } from '../../src/shared/face-index';
import type { EventConfig } from '../../src/shared/events';
import { createPhotoRef, openPhotoRef } from '../../src/shared/photo-ref';
import { log } from '../shared/log';
import { publicFile } from '../shared/paths';
import type { DriveClient, DriveImage } from './drive-client';
import { readIndex, writeIndex } from './index-file';
import type { NodeFaceEngine } from './node-face-engine';
import { buildPhotoEntry, checksumOf, publicPhotoId } from './photo-entry';

const DETECTION_SIZE = 1600;
const DOWNLOAD_CONCURRENCY = 4;
const CHECKPOINT_EVERY = 25;

export interface IndexDeps {
  drive: DriveClient;
  engine: NodeFaceEngine;
  secret: string;
}

/** Maps Drive file ID -> existing entry, so unchanged photos are reused instead of re-detected. */
async function previousEntries(index: FaceIndex | null, eventId: string, secret: string): Promise<Map<string, IndexedPhoto>> {
  const map = new Map<string, IndexedPhoto>();
  if (!index || index.model !== FACE_MODEL_ID) return map;
  for (const photo of index.photos) {
    const fileId = await openPhotoRef(secret, eventId, photo.ref);
    if (fileId) map.set(fileId, photo);
  }
  return map;
}

async function processImage(event: EventConfig, image: DriveImage, deps: IndexDeps, download: Promise<Buffer>): Promise<IndexedPhoto> {
  const { faces, width, height } = await deps.engine.detect(await download, DETECTION_SIZE);
  return buildPhotoEntry({
    id: publicPhotoId(deps.secret, event.id, image.id),
    ref: await createPhotoRef(deps.secret, event.id, image.id),
    image,
    faces,
    detectionSize: { width, height },
  });
}

/**
 * (Re)builds one event's face index. Only new or changed photos are downloaded and analysed;
 * photos removed from Drive disappear from the index. Never modifies Drive.
 */
export async function buildEventIndex(event: EventConfig, deps: IndexDeps, options: { full: boolean }): Promise<FaceIndex> {
  const file = publicFile(event.indexPath);
  const folderName = await deps.drive.assertFolder(event.folderId);
  log(`${event.id}: listing "${folderName}"…`);
  const images = await deps.drive.listImages(event.folderId);
  const previous = options.full ? new Map() : await previousEntries(readIndex(file, event.id), event.id, deps.secret);

  const photos: IndexedPhoto[] = [];
  const todo: DriveImage[] = [];
  for (const image of images) {
    const old = previous.get(image.id);
    if (old && old.checksum === checksumOf(image)) photos.push(old);
    else todo.push(image);
  }
  log(`${event.id}: ${images.length} images, ${photos.length} unchanged, ${todo.length} to analyse`);

  const index = (): FaceIndex => ({
    version: FACE_INDEX_VERSION,
    eventId: event.id,
    eventName: event.name,
    generatedAt: new Date().toISOString(),
    model: FACE_MODEL_ID,
    descriptorLength: DESCRIPTOR_LENGTH,
    photos: [...photos].sort((a, b) => a.name.localeCompare(b.name)),
  });

  let failed = 0;
  const downloads = new Map<number, Promise<Buffer>>();
  const startDownload = (i: number) => {
    const image = todo[i];
    if (image && !downloads.has(i)) downloads.set(i, deps.drive.downloadForDetection(image, DETECTION_SIZE));
  };
  for (let i = 0; i < todo.length; i++) {
    for (let k = i; k < i + DOWNLOAD_CONCURRENCY; k++) startDownload(k);
    const image = todo[i]!;
    try {
      const entry = await processImage(event, image, deps, downloads.get(i)!);
      photos.push(entry);
      log(`${event.id}: [${i + 1}/${todo.length}] ${image.name} → ${entry.faces.length} face(s)`);
    } catch (error) {
      failed++;
      log(`${event.id}: [${i + 1}/${todo.length}] ${image.name} SKIPPED (${error instanceof Error ? error.message : error})`);
    }
    downloads.delete(i);
    if ((i + 1) % CHECKPOINT_EVERY === 0) writeIndex(file, index());
  }

  const result = index();
  writeIndex(file, result);
  const faces = result.photos.reduce((n, p) => n + p.faces.length, 0);
  log(`${event.id}: wrote ${event.indexPath} (${result.photos.length} photos, ${faces} faces${failed ? `, ${failed} failed` : ''})`);
  return result;
}
