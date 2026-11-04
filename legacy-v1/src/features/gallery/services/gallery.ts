import type { GalleryPhotoRecord, GalleryResponse } from '../types';

export interface GalleryDeps {
  findGalleryPhotos(token: string): Promise<GalleryPhotoRecord[] | null>;
  findGalleryPhoto(token: string, photoId: string): Promise<GalleryPhotoRecord | null>;
  isTokenShape(token: string): boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Client-safe gallery: opaque photo ids only, never Drive IDs. */
export async function getGalleryWith(deps: GalleryDeps, token: string): Promise<GalleryResponse | null> {
  if (!deps.isTokenShape(token)) return null;
  const photos = await deps.findGalleryPhotos(token);
  if (!photos) return null;
  return { photos: photos.map((p) => ({ id: p.id, width: p.width, height: p.height })) };
}

/** A token can only reach photos inside its own gallery. */
export async function resolvePhotoWith(deps: GalleryDeps, token: string, photoId: string): Promise<GalleryPhotoRecord | null> {
  if (!deps.isTokenShape(token) || !UUID.test(photoId)) return null;
  return deps.findGalleryPhoto(token, photoId);
}

/** Safe download name with a unique suffix. */
export function downloadName(photo: GalleryPhotoRecord, index?: number): string {
  const base = photo.fileName.replace(/[^\w.\- ]+/g, '_') || 'photo.jpg';
  return index === undefined ? base : `${String(index + 1).padStart(3, '0')}-${base}`;
}
