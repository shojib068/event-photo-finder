export type PhotoSize = 'thumb' | 'full';

/** URL of a photo served through the app's photo proxy (Drive is never contacted by the browser). */
export function photoUrl(eventId: string, ref: string, size: PhotoSize, download = false): string {
  const params = new URLSearchParams({ size });
  if (download) params.set('download', '1');
  return `/api/photo/${encodeURIComponent(eventId)}/${encodeURIComponent(ref)}?${params.toString()}`;
}
