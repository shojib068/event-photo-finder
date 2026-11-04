import type { EventRecord, EventSummary } from './types';

type AvailabilityFields = Pick<EventRecord, 'status' | 'active'>;

/** A QR code works for guests only when indexing is finished AND the admin switched it on. */
export function isEventAvailable(event: AvailabilityFields | null | undefined): boolean {
  return !!event && event.status === 'ready' && event.active === true;
}

/** The Active switch can be turned on only after indexing finished with at least one photo. */
export function canActivate(event: Pick<EventRecord, 'status' | 'photosTotal'>): boolean {
  return event.status === 'ready' && event.photosTotal > 0;
}

/** Strips server-only fields. */
export function toEventSummary(event: EventRecord): EventSummary {
  return {
    id: event.id,
    folderName: event.folderName,
    status: event.status,
    active: event.active,
    photosTotal: event.photosTotal,
    photosDone: event.photosDone,
    noPhotos: event.status === 'ready' && event.photosTotal === 0,
  };
}
