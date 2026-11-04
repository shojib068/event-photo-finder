import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { isFaceIndex, type FaceIndex } from '../../src/shared/face-index';

export function readIndex(file: string, eventId: string): FaceIndex | null {
  if (!existsSync(file)) return null;
  const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
  return isFaceIndex(parsed, eventId) ? parsed : null;
}

/** Atomic write so a crash never leaves a half-written index that would be deployed. */
export function writeIndex(file: string, index: FaceIndex): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(index));
  renameSync(tmp, file);
}
