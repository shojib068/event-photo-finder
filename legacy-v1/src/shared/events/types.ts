export type EventStatus = 'pending' | 'indexing' | 'ready' | 'failed';

/** Server-only row. `driveFolderId` must never be sent to clients. */
export interface EventRecord {
  id: string;
  slug: string;
  driveFolderId: string;
  folderName: string;
  status: EventStatus;
  active: boolean;
  photosTotal: number;
  photosDone: number;
  error: string | null;
  createdAt: Date;
}

/** Client-safe view of an event (no Drive IDs). */
export interface EventSummary {
  id: string;
  folderName: string;
  status: EventStatus;
  active: boolean;
  photosTotal: number;
  photosDone: number;
  noPhotos: boolean;
}
