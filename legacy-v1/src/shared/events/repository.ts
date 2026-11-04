import { query } from '@/core/db';
import type { EventRecord, EventStatus } from './types';

interface EventRow {
  id: string;
  slug: string;
  drive_folder_id: string;
  folder_name: string;
  status: EventStatus;
  active: boolean;
  photos_total: number;
  photos_done: number;
  error: string | null;
  created_at: Date;
}

const COLUMNS = 'id, slug, drive_folder_id, folder_name, status, active, photos_total, photos_done, error, created_at';

export function mapEventRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    driveFolderId: row.drive_folder_id,
    folderName: row.folder_name,
    status: row.status,
    active: row.active,
    photosTotal: row.photos_total,
    photosDone: row.photos_done,
    error: row.error,
    createdAt: row.created_at,
  };
}

async function one(sql: string, params: unknown[]): Promise<EventRecord | null> {
  const rows = await query<EventRow>(sql, params);
  return rows[0] ? mapEventRow(rows[0]) : null;
}

export function findEventById(id: string): Promise<EventRecord | null> {
  return one(`SELECT ${COLUMNS} FROM events WHERE id = $1`, [id]);
}

export function findEventBySlug(slug: string): Promise<EventRecord | null> {
  return one(`SELECT ${COLUMNS} FROM events WHERE slug = $1`, [slug]);
}

export function findEventByFolderId(driveFolderId: string): Promise<EventRecord | null> {
  return one(`SELECT ${COLUMNS} FROM events WHERE drive_folder_id = $1`, [driveFolderId]);
}

/** Newest first, as on the admin page. */
export async function listEvents(): Promise<EventRecord[]> {
  const rows = await query<EventRow>(`SELECT ${COLUMNS} FROM events ORDER BY created_at DESC`);
  return rows.map(mapEventRow);
}

export async function insertEvent(input: { slug: string; driveFolderId: string; folderName: string }): Promise<EventRecord> {
  const rows = await query<EventRow>(
    `INSERT INTO events (slug, drive_folder_id, folder_name, status, active)
     VALUES ($1, $2, $3, 'pending', false) RETURNING ${COLUMNS}`,
    [input.slug, input.driveFolderId, input.folderName],
  );
  return mapEventRow(rows[0]!);
}

export function setEventActive(id: string, active: boolean): Promise<EventRecord | null> {
  return one(`UPDATE events SET active = $2, updated_at = now() WHERE id = $1 RETURNING ${COLUMNS}`, [id, active]);
}

/** Puts a failed event back in the queue (Retry). */
export function requeueEvent(id: string): Promise<EventRecord | null> {
  return one(
    `UPDATE events SET status = 'pending', error = NULL, updated_at = now()
     WHERE id = $1 AND status = 'failed' RETURNING ${COLUMNS}`,
    [id],
  );
}
