import { describe, expect, it } from 'vitest';
import { parseConfig } from '../schema';

const secret = 'x'.repeat(32);

describe('parseConfig', () => {
  it('fails when ADMIN_PATH_SECRET is missing', () => {
    expect(() => parseConfig({})).toThrow(/ADMIN_PATH_SECRET/);
  });

  it('fails when the admin secret is too short', () => {
    expect(() => parseConfig({ ADMIN_PATH_SECRET: 'short' })).toThrow(/ADMIN_PATH_SECRET/);
  });

  it('applies defaults', () => {
    const config = parseConfig({ ADMIN_PATH_SECRET: secret });
    expect(config.MATCH_THRESHOLD).toBe(0.45);
    expect(config.WORKER_CONCURRENCY).toBe(2);
  });

  it('rejects an out-of-range threshold', () => {
    expect(() => parseConfig({ ADMIN_PATH_SECRET: secret, MATCH_THRESHOLD: '1.5' })).toThrow();
  });
});
