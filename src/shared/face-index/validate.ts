import { FACE_INDEX_VERSION, type FaceIndex } from './types';

/** Light structural check of a downloaded index (guards against HTML fallbacks and old formats). */
export function isFaceIndex(value: unknown, eventId: string): value is FaceIndex {
  if (typeof value !== 'object' || value === null) return false;
  const index = value as Partial<FaceIndex>;
  return index.version === FACE_INDEX_VERSION && index.eventId === eventId && Array.isArray(index.photos);
}
