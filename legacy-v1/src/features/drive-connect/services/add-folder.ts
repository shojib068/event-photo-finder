import type { EventRecord } from '@/shared/events';
import type { DriveFolderInfo } from '@/core/storage';
import type { AddFolderResult } from '../types';
import { parseDriveFolderLink } from './parse-link';

export interface AddFolderDeps {
  getDriveFile(folderId: string): Promise<DriveFolderInfo>;
  isFolderMime(mimeType: string): boolean;
  driveErrorStatus(err: unknown): number | undefined;
  isDriveNotConfigured(err: unknown): boolean;
  findEventByFolderId(folderId: string): Promise<EventRecord | null>;
  insertEvent(input: { slug: string; driveFolderId: string; folderName: string }): Promise<EventRecord>;
  newSlug(): string;
}

/** Validates a pasted link, checks Drive access and queues the folder as a new event. */
export async function addDriveFolderWith(deps: AddFolderDeps, link: string): Promise<AddFolderResult> {
  const folderId = parseDriveFolderLink(link);
  if (!folderId) return { ok: false, code: 'INVALID_LINK' };

  const existing = await deps.findEventByFolderId(folderId);
  if (existing) return { ok: false, code: 'ALREADY_ADDED', event: existing };

  let folder: DriveFolderInfo;
  try {
    folder = await deps.getDriveFile(folderId);
  } catch (err) {
    if (deps.isDriveNotConfigured(err)) return { ok: false, code: 'DRIVE_NOT_CONFIGURED' };
    const status = deps.driveErrorStatus(err);
    if (status === 403 || status === 404) return { ok: false, code: 'FOLDER_NOT_SHARED' };
    throw err;
  }
  if (!deps.isFolderMime(folder.mimeType)) return { ok: false, code: 'NOT_A_FOLDER' };

  try {
    const event = await deps.insertEvent({ slug: deps.newSlug(), driveFolderId: folderId, folderName: folder.name });
    return { ok: true, event };
  } catch (err) {
    // Unique violation from a concurrent add of the same folder.
    if ((err as { code?: string }).code === '23505') {
      const raced = await deps.findEventByFolderId(folderId);
      if (raced) return { ok: false, code: 'ALREADY_ADDED', event: raced };
    }
    throw err;
  }
}
