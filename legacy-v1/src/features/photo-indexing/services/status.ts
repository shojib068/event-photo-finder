import { findEventById, listEvents, toEventSummary, type EventSummary } from '@/shared/events';

export async function getIndexingStatus(eventId: string): Promise<EventSummary | null> {
  const event = await findEventById(eventId);
  return event ? toEventSummary(event) : null;
}

/** Every link, newest first, without Drive IDs. */
export async function listEventStatuses(): Promise<{ summary: EventSummary; slug: string }[]> {
  return (await listEvents()).map((e) => ({ summary: toEventSummary(e), slug: e.slug }));
}
