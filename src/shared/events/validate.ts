import { defaultIndexPath, isValidEventId } from './event-id';
import { extractFolderId } from './folder-id';
import type { EventConfig, EventsFile } from './types';

export interface ValidationResult {
  events: EventConfig[];
  errors: string[];
}

function validateEntry(raw: unknown, position: number): { event?: EventConfig; errors: string[] } {
  const where = `events[${position}]`;
  if (typeof raw !== 'object' || raw === null) return { errors: [`${where}: must be an object`] };
  const entry = raw as Record<string, unknown>;
  const errors: string[] = [];
  if (!isValidEventId(entry.id)) errors.push(`${where}.id: must be a lowercase slug (a-z, 0-9, -), 3-64 chars`);
  if (typeof entry.name !== 'string' || entry.name.trim() === '') errors.push(`${where}.name: required`);
  const folderId = typeof entry.folderId === 'string' ? extractFolderId(entry.folderId) : null;
  if (!folderId) errors.push(`${where}.folderId: must be a Drive folder ID or folder link`);
  const id = String(entry.id);
  const indexPath = entry.indexPath ?? defaultIndexPath(id);
  if (indexPath !== defaultIndexPath(id)) errors.push(`${where}.indexPath: must be "${defaultIndexPath(id)}"`);
  if (errors.length > 0) return { errors };
  return { event: { id, name: String(entry.name).trim(), folderId: folderId as string, indexPath: indexPath as string }, errors };
}

/** Validates the whole events file: shape, IDs, duplicate IDs and duplicate folders. */
export function validateEventsFile(raw: unknown): ValidationResult {
  const list = (raw as Partial<EventsFile> | null)?.events;
  if (!Array.isArray(list)) return { events: [], errors: ['"events" must be an array'] };
  const events: EventConfig[] = [];
  const errors: string[] = [];
  list.forEach((entry, i) => {
    const result = validateEntry(entry, i);
    errors.push(...result.errors);
    if (result.event) events.push(result.event);
  });
  const seenIds = new Set<string>();
  const seenFolders = new Set<string>();
  for (const event of events) {
    if (seenIds.has(event.id)) errors.push(`duplicate event id "${event.id}"`);
    if (seenFolders.has(event.folderId)) errors.push(`event "${event.id}" reuses a folder of another event`);
    seenIds.add(event.id);
    seenFolders.add(event.folderId);
  }
  return { events, errors };
}
