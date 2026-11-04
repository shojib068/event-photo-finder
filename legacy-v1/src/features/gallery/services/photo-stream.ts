import { Readable } from 'node:stream';
import archiver from 'archiver';
import sharp from 'sharp';
import { downloadDriveFile, readThumb, streamDriveFile, writeThumb } from '@/core/storage';
import { isTokenShape } from '@/shared/tokens';
import { THUMB_QUALITY, THUMB_WIDTH } from '../constants';
import type { GalleryPhotoRecord, PhotoSize } from '../types';
import { downloadName, getGalleryWith, resolvePhotoWith, type GalleryDeps } from './gallery';
import { findGalleryPhoto, findGalleryPhotos } from './repository';

const deps: GalleryDeps = { findGalleryPhotos, findGalleryPhoto, isTokenShape };

export const getGallery = (token: string) => getGalleryWith(deps, token);

async function thumbnail(photo: GalleryPhotoRecord): Promise<Buffer> {
  const cached = await readThumb(photo.id);
  if (cached) return cached;
  const original = await downloadDriveFile(photo.driveFileId);
  const thumb = await sharp(original).rotate().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: THUMB_QUALITY }).toBuffer();
  await writeThumb(photo.id, thumb);
  return thumb;
}

export interface PhotoStream {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  fileName: string;
}

const toWeb = (stream: Readable) => Readable.toWeb(stream) as ReadableStream<Uint8Array>;

/** Photo bytes for a (token, photo) pair, or null (404) when the pair is not in the gallery. */
export async function streamPhoto(token: string, photoId: string, size: PhotoSize): Promise<PhotoStream | null> {
  const photo = await resolvePhotoWith(deps, token, photoId);
  if (!photo) return null;
  if (size === 'thumb') {
    return { body: toWeb(Readable.from([await thumbnail(photo)])), contentType: 'image/webp', fileName: downloadName(photo) };
  }
  return { body: toWeb(await streamDriveFile(photo.driveFileId)), contentType: photo.mimeType, fileName: downloadName(photo) };
}

/** Streams a ZIP (store mode) of every photo in the gallery, fetched one by one from Drive. */
export async function streamZip(token: string): Promise<ReadableStream<Uint8Array> | null> {
  if (!isTokenShape(token)) return null;
  const photos = await findGalleryPhotos(token);
  if (!photos) return null;
  const zip = archiver('zip', { store: true });
  void (async () => {
    try {
      for (const [i, photo] of photos.entries()) {
        const stream = await streamDriveFile(photo.driveFileId);
        zip.append(stream, { name: downloadName(photo, i) });
        await new Promise<void>((resolve, reject) => {
          stream.once('end', resolve);
          stream.once('error', reject);
        });
      }
      await zip.finalize();
    } catch (err) {
      zip.abort();
      zip.destroy(err instanceof Error ? err : new Error('zip failed'));
    }
  })();
  return toWeb(zip);
}
