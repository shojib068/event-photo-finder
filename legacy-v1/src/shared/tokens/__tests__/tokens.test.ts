import { describe, expect, it } from 'vitest';
import { isTokenShape, randomToken } from '..';

describe('randomToken', () => {
  it('is 22 base64url chars (128 bits)', () => {
    const token = randomToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(16);
  });

  it('is unique across many calls', () => {
    const tokens = new Set(Array.from({ length: 10_000 }, randomToken));
    expect(tokens.size).toBe(10_000);
  });

  it('shape check rejects guessable or malformed values', () => {
    expect(isTokenShape(randomToken())).toBe(true);
    expect(isTokenShape('1')).toBe(false);
    expect(isTokenShape('../../etc/passwd')).toBe(false);
    expect(isTokenShape('a'.repeat(23))).toBe(false);
  });
});
