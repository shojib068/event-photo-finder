/** Lowercase slug, 3-64 chars, used in URLs and QR codes. Never change after printing a QR code. */
const EVENT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])$/;

export function isValidEventId(value: unknown): value is string {
  return typeof value === 'string' && EVENT_ID_PATTERN.test(value);
}

export function eventPagePath(eventId: string): string {
  return `/event/${eventId}`;
}

export function publicMetaPath(eventId: string): string {
  return `/events/${eventId}.json`;
}

export function defaultIndexPath(eventId: string): string {
  return `/indexes/${eventId}.json`;
}
