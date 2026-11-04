import { describe, expect, it } from 'vitest';
import { matchRoute } from '../match-route';

describe('matchRoute', () => {
  it('maps event URLs', () => {
    expect(matchRoute('/event/wedding-2026')).toEqual({ name: 'event', eventId: 'wedding-2026' });
    expect(matchRoute('/event/wedding-2026/')).toEqual({ name: 'event', eventId: 'wedding-2026' });
  });
  it('everything else is not found', () => {
    for (const p of ['/', '/event', '/event/a/b', '/admin']) expect(matchRoute(p)).toEqual({ name: 'not-found' });
  });
});
