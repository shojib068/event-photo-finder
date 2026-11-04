import { randomBytes } from 'node:crypto';

/** 128-bit random, base64url (22 chars). Used for gallery tokens and event slugs. */
export function randomToken(): string {
  return randomBytes(16).toString('base64url');
}

const TOKEN_SHAPE = /^[A-Za-z0-9_-]{22}$/;

/** Cheap shape check before hitting the DB. */
export function isTokenShape(value: string): boolean {
  return TOKEN_SHAPE.test(value);
}
