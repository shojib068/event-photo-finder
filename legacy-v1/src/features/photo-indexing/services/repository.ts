import { query, toVectorLiteral, withTransaction } from '@/core/db';
import { mapEventRow, type EventRecord } from '@/shared/events';
import type { DriveImageFile } from '@/core/storage';
import type { DetectedFace } from '@/shared/face-provider';
import type { PendingPhoto, PhotoStatus } from '../types';

/** Claims the oldest pending event (queue). Resumes an event left `indexing` by a crashed worker first. */
export async function claimNextEvent(): Promise<EventRecord | null> {
  return withTransaction(async (client) => {
    const res = await client.query(
      `SELECT * FROM events WHERE status IN ('indexing', 'pending')
       ORDER BY (status = 'indexing') DESC, created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`,
    );
    const row = res.rows[0];
    if (!row) return null;
    const updated = await client.query(
      `UPDATE events SET status = 'indexing', error = NULL, updated_at = now() WHERE id = $1 RETURNING *`,
      [row.id],
    );
    return mapEventRow(updated.rows[0]);
  });
}

export async function upsertPhotos(eventId: string, files: DriveImageFile[]): Promise<void> {
  for (const f of files) {
    await query(
      `INSERT INTO photos (event_id, drive_file_id, file_name, mime_type, width, height, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       ON CONFLICT (event_id, drive_file_id) DO UPDATE SET file_name = EXCLUDED.file_name`,
      [eventId, f.id, f.name, f.mimeType, f.width, f.height],
    );
  }
  await refreshCounts(eventId);
}

export async function refreshCounts(eventId: string): Promise<void> {
  await query(
    `UPDATE events SET
       photos_total = (SELECT count(*) FROM photos WHERE event_id = $1),
       photos_done  = (SELECT count(*) FROM photos WHERE event_id = $1 AND status <> 'pending'),
       updated_at = now()
     WHERE id = $1`,
    [eventId],
  );
}

export async function listPendingPhotos(eventId: string): Promise<PendingPhoto[]> {
  const rows = await query<{ id: string; drive_file_id: string; mime_type: string; attempts: number }>(
    `SELECT id, drive_file_id, mime_type, attempts FROM photos WHERE event_id = $1 AND status = 'pending' ORDER BY file_name`,
    [eventId],
  );
  return rows.map((r) => ({ id: r.id, driveFileId: r.drive_file_id, mimeType: r.mime_type, attempts: r.attempts }));
}

/** Replaces a photo's faces and marks it done in one transaction (idempotent on restart). */
export async function saveFaces(eventId: string, photoId: string, faces: DetectedFace[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM faces WHERE photo_id = $1', [photoId]);
    for (const f of faces) {
      await client.query(
        'INSERT INTO faces (event_id, photo_id, embedding, bbox, det_score) VALUES ($1, $2, $3, $4, $5)',
        [eventId, photoId, toVectorLiteral(f.embedding), f.bbox, f.detScore],
      );
    }
    await client.query(`UPDATE photos SET status = 'done' WHERE id = $1`, [photoId]);
    await client.query('UPDATE events SET photos_done = photos_done + 1, updated_at = now() WHERE id = $1', [eventId]);
  });
}

export async function markPhoto(eventId: string, photoId: string, status: Exclude<PhotoStatus, 'pending' | 'done'>, attempts: number) {
  await query('UPDATE photos SET status = $2, attempts = $3 WHERE id = $1', [photoId, status, attempts]);
  await query('UPDATE events SET photos_done = photos_done + 1, updated_at = now() WHERE id = $1', [eventId]);
}

/** Ready, or failed only when every photo failed. */
export async function finishEvent(eventId: string): Promise<void> {
  await query(
    `UPDATE events SET
       status = CASE WHEN photos_total > 0 AND NOT EXISTS (
                  SELECT 1 FROM photos WHERE event_id = $1 AND status <> 'failed')
                THEN 'failed' ELSE 'ready' END,
       error  = CASE WHEN photos_total > 0 AND NOT EXISTS (
                  SELECT 1 FROM photos WHERE event_id = $1 AND status <> 'failed')
                THEN 'All photos failed to index' ELSE NULL END,
       updated_at = now()
     WHERE id = $1`,
    [eventId],
  );
}

export async function failEvent(eventId: string, error: string): Promise<void> {
  await query(`UPDATE events SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`, [eventId, error]);
}

/** Retry: failed photos go back to pending, then the event is re-queued. */
export async function requeueFailed(eventId: string): Promise<EventRecord | null> {
  return withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE events SET status = 'pending', error = NULL, updated_at = now()
       WHERE id = $1 AND status = 'failed' RETURNING *`,
      [eventId],
    );
    if (!res.rows[0]) return null;
    await client.query(`UPDATE photos SET status = 'pending', attempts = 0 WHERE event_id = $1 AND status = 'failed'`, [eventId]);
    return mapEventRow(res.rows[0]);
  });
}
