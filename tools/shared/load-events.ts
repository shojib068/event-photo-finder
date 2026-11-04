import { readFileSync } from 'node:fs';
import { validateEventsFile, type EventConfig } from '../../src/shared/events';
import { EVENTS_CONFIG } from './paths';

/** Reads and validates config/events.json; throws with every problem listed. */
export function loadEvents(): EventConfig[] {
  const raw: unknown = JSON.parse(readFileSync(EVENTS_CONFIG, 'utf8'));
  const { events, errors } = validateEventsFile(raw);
  if (errors.length > 0) throw new Error(`config/events.json is invalid:\n  - ${errors.join('\n  - ')}`);
  return events;
}

export function findEvent(events: EventConfig[], id: string): EventConfig {
  const event = events.find((e) => e.id === id);
  if (!event) throw new Error(`Unknown event "${id}". Known: ${events.map((e) => e.id).join(', ') || '(none)'}`);
  return event;
}
