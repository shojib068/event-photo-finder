import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../services/rate-limit';

describe('createRateLimiter', () => {
  it('allows 10 per minute per IP then blocks', () => {
    let t = 0;
    const allow = createRateLimiter(10, 60_000, () => t);
    for (let i = 0; i < 10; i++) expect(allow('ip')).toBe(true);
    expect(allow('ip')).toBe(false);
    expect(allow('other')).toBe(true);
    t = 60_001;
    expect(allow('ip')).toBe(true);
  });
});
