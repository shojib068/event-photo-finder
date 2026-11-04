import { timingSafeEqual } from 'node:crypto';
import { getConfig } from '@/core/config';

/** Admin page has no login (by spec): it lives at /admin/<ADMIN_PATH_SECRET>. */
export function isAdminSecret(candidate: string): boolean {
  const expected = Buffer.from(getConfig().ADMIN_PATH_SECRET);
  const given = Buffer.from(candidate);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
