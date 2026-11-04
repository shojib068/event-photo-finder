export type PhotoStatus = 'pending' | 'done' | 'skipped' | 'failed';

/** Server-only photo row used by the worker. */
export interface PendingPhoto {
  id: string;
  driveFileId: string;
  mimeType: string;
  attempts: number;
}

export type { AdminEventRow, AdminEventsResponse } from '@/shared/api-types';
