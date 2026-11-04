import { existsSync, readFileSync } from 'node:fs';
import type { EventConfig, PublicEventMeta } from '../../src/shared/events';
import { isFaceIndex } from '../../src/shared/face-index';
import { publicFile } from '../shared/paths';

/** Public metadata for one event. Deliberately excludes the Drive folder. */
export function buildPublicMeta(event: EventConfig): PublicEventMeta {
  const file = publicFile(event.indexPath);
  const base = { id: event.id, name: event.name, indexPath: event.indexPath };
  if (!existsSync(file)) return { ...base, indexed: false, photoCount: 0, faceCount: 0, indexedAt: null };
  const index: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!isFaceIndex(index, event.id)) throw new Error(`${event.indexPath} is not a valid index for "${event.id}"`);
  const faceCount = index.photos.reduce((n, p) => n + p.faces.length, 0);
  return { ...base, indexed: true, photoCount: index.photos.length, faceCount, indexedAt: index.generatedAt };
}
