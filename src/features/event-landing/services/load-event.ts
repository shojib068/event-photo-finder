import { isValidEventId, publicMetaPath, type PublicEventMeta } from '../../../shared/events';

export type LoadEventResult = { status: 'ok'; meta: PublicEventMeta } | { status: 'not-found' } | { status: 'error' };

export function isPublicEventMeta(value: unknown, eventId: string): value is PublicEventMeta {
  if (typeof value !== 'object' || value === null) return false;
  const meta = value as Partial<PublicEventMeta>;
  return meta.id === eventId && typeof meta.name === 'string' && typeof meta.indexPath === 'string';
}

/** Loads only this event's public metadata. Unknown or malformed IDs never hit the network. */
export async function loadEvent(eventId: string, fetchFn: typeof fetch = fetch): Promise<LoadEventResult> {
  if (!isValidEventId(eventId)) return { status: 'not-found' };
  let response: Response;
  try {
    response = await fetchFn(publicMetaPath(eventId), { cache: 'no-cache' });
  } catch {
    return { status: 'error' };
  }
  if (response.status === 404) return { status: 'not-found' };
  if (!response.ok) return { status: 'error' };
  const isJson = response.headers.get('content-type')?.includes('json') ?? false;
  if (!isJson) return { status: 'not-found' }; // SPA fallback served HTML
  const body: unknown = await response.json().catch(() => null);
  return isPublicEventMeta(body, eventId) ? { status: 'ok', meta: body } : { status: 'not-found' };
}
