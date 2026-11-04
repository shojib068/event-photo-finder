import { canActivate, type EventRecord } from '@/shared/events';

export interface SetActiveDeps {
  findEventById(id: string): Promise<EventRecord | null>;
  setEventActive(id: string, active: boolean): Promise<EventRecord | null>;
}

export type SetActiveResult = { ok: true; event: EventRecord } | { ok: false; code: 'NOT_FOUND' | 'NOT_READY' };

/**
 * Switches a link on/off. On is allowed only once indexing finished with photos.
 * Off is always allowed. Galleries are never touched (they keep working).
 */
export async function setActiveWith(deps: SetActiveDeps, id: string, active: boolean): Promise<SetActiveResult> {
  const event = await deps.findEventById(id);
  if (!event) return { ok: false, code: 'NOT_FOUND' };
  if (active && !canActivate(event)) return { ok: false, code: 'NOT_READY' };
  const updated = await deps.setEventActive(id, active);
  return updated ? { ok: true, event: updated } : { ok: false, code: 'NOT_FOUND' };
}
