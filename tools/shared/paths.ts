import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const EVENTS_CONFIG = path.join(ROOT, 'config/events.json');
export const PUBLIC_DIR = path.join(ROOT, 'public');
export const QR_DIR = path.join(ROOT, 'qr-codes');

/** Maps a public URL path like /indexes/x.json to its file in public/. */
export function publicFile(urlPath: string): string {
  return path.join(PUBLIC_DIR, urlPath.replace(/^\/+/, ''));
}
