import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getConfig } from '@/core/config';

const SAFE_KEY = /^[a-zA-Z0-9-]+$/;

function cachePath(key: string): string {
  if (!SAFE_KEY.test(key)) throw new Error('Invalid thumbnail cache key');
  return path.resolve(getConfig().THUMB_CACHE_DIR, `${key}.webp`);
}

/** Thumbnails of Drive photos only (keyed by photo.id). Never used for selfies. */
export async function readThumb(photoId: string): Promise<Buffer | null> {
  try {
    return await readFile(cachePath(photoId));
  } catch {
    return null;
  }
}

export async function writeThumb(photoId: string, data: Buffer): Promise<void> {
  const file = cachePath(photoId);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}
