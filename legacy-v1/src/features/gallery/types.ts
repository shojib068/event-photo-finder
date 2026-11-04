/** Server-only photo reference (has the Drive file ID). */
export interface GalleryPhotoRecord {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

/** Client-safe photo. Only the opaque app photo id. */
export interface GalleryPhoto {
  id: string;
  width: number | null;
  height: number | null;
}

/** Response of GET /api/g/:token. */
export interface GalleryResponse {
  photos: GalleryPhoto[];
}

export type PhotoSize = 'thumb' | 'full';
