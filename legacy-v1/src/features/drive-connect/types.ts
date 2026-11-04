import type { EventRecord } from '@/shared/events';

export type AddFolderErrorCode = 'INVALID_LINK' | 'NOT_A_FOLDER' | 'FOLDER_NOT_SHARED' | 'ALREADY_ADDED' | 'DRIVE_NOT_CONFIGURED';

export type AddFolderResult =
  | { ok: true; event: EventRecord }
  | { ok: false; code: AddFolderErrorCode; event?: EventRecord };

/** Response of POST /api/admin/:secret/events. */
export interface AddEventResponse {
  id: string;
  status: 'pending';
  active: false;
}
