import { query } from '@/core/db';
import type { GalleryPhotoRecord } from '../types';

interface Row {
  id: string;
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  width: number | null;
  height: number | null;
}

const map = (r: Row): GalleryPhotoRecord => ({
  id: r.id, driveFileId: r.drive_file_id, fileName: r.file_name, mimeType: r.mime_type, width: r.width, height: r.height,
});

/** null when the token does not exist. Works regardless of the event's Active switch. */
export async function findGalleryPhotos(token: string): Promise<GalleryPhotoRecord[] | null> {
  const exists = await query('SELECT 1 FROM galleries WHERE token = $1', [token]);
  if (exists.length === 0) return null;
  const rows = await query<Row>(
    `SELECT p.id, p.drive_file_id, p.file_name, p.mime_type, p.width, p.height
     FROM gallery_photos gp JOIN photos p ON p.id = gp.photo_id
     WHERE gp.token = $1 ORDER BY gp.score DESC, p.file_name`,
    [token],
  );
  return rows.map(map);
}

/** Only if the (token, photo) pair exists in gallery_photos. */
export async function findGalleryPhoto(token: string, photoId: string): Promise<GalleryPhotoRecord | null> {
  const rows = await query<Row>(
    `SELECT p.id, p.drive_file_id, p.file_name, p.mime_type, p.width, p.height
     FROM gallery_photos gp JOIN photos p ON p.id = gp.photo_id
     WHERE gp.token = $1 AND gp.photo_id = $2`,
    [token, photoId],
  );
  return rows[0] ? map(rows[0]) : null;
}
