import { setTimeout as sleep } from 'node:timers/promises';
import { getConfig } from '@/core/config';
import { getLogger } from '@/core/logger';
import { downloadDriveFile, listImagesRecursive } from '@/core/storage';
import { FaceServiceDownError, getFaceProvider } from '@/shared/face-provider';
import { WORKER_POLL_MS } from '../constants';
import { indexEvent } from './index-event';
import * as repo from './repository';

function deps() {
  const log = getLogger();
  return {
    listImages: listImagesRecursive,
    download: downloadDriveFile,
    detectAndEmbed: (image: Buffer) => getFaceProvider().detectAndEmbed(image),
    upsertPhotos: repo.upsertPhotos,
    listPendingPhotos: repo.listPendingPhotos,
    saveFaces: repo.saveFaces,
    markPhoto: repo.markPhoto,
    finishEvent: repo.finishEvent,
    onPhotoError: (photoId: string, err: unknown) =>
      log.warn({ photoId, err: err instanceof Error ? err.message : String(err) }, 'photo indexing attempt failed'),
    sleep: (ms: number) => sleep(ms),
    concurrency: getConfig().WORKER_CONCURRENCY,
  };
}

/** One pass: index the next queued event if any. Returns true if an event was processed. */
export async function runIndexingOnce(): Promise<boolean> {
  const log = getLogger();
  if (!(await getFaceProvider().health())) {
    log.warn('face-service unavailable; indexing paused');
    return false;
  }
  const event = await repo.claimNextEvent();
  if (!event) return false;
  log.info({ eventId: event.id }, 'indexing start');
  try {
    await indexEvent(deps(), event);
    log.info({ eventId: event.id }, 'indexing finish');
  } catch (err) {
    const message = err instanceof FaceServiceDownError ? 'Face service unavailable' : 'Could not read the Drive folder';
    log.error({ eventId: event.id, err: err instanceof Error ? err.message : String(err) }, 'indexing failed');
    await repo.failEvent(event.id, message);
  }
  return true;
}

/** Worker loop (npm run worker): polls every 5 s, one event at a time, in the order added. */
export async function runIndexingWorker(signal?: AbortSignal): Promise<void> {
  const log = getLogger();
  log.info('indexing worker started');
  while (!signal?.aborted) {
    try {
      const worked = await runIndexingOnce();
      if (worked) continue;
    } catch (err) {
      log.error({ err: err instanceof Error ? err.message : String(err) }, 'worker loop error');
    }
    await sleep(WORKER_POLL_MS, undefined, { signal }).catch(() => undefined);
  }
}
