import { describe, expect, it } from 'vitest';
import { canActivate, isEventAvailable, toEventSummary } from '../availability';
import type { EventRecord, EventStatus } from '../types';

const statuses: EventStatus[] = ['pending', 'indexing', 'ready', 'failed'];

function event(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: 'e1', slug: 's', driveFolderId: 'DRIVE_SECRET_ID', folderName: 'Ceremony',
    status: 'ready', active: true, photosTotal: 10, photosDone: 10, error: null, createdAt: new Date(),
    ...overrides,
  };
}

describe('isEventAvailable (QR works only when Ready AND Active)', () => {
  it.each(statuses)('status %s, active on', (status) => {
    expect(isEventAvailable(event({ status, active: true }))).toBe(status === 'ready');
  });

  it.each(statuses)('status %s, active off is never available', (status) => {
    expect(isEventAvailable(event({ status, active: false }))).toBe(false);
  });

  it('unknown event is not available', () => {
    expect(isEventAvailable(null)).toBe(false);
  });
});

describe('canActivate', () => {
  it.each(['pending', 'indexing', 'failed'] as const)('cannot activate while %s', (status) => {
    expect(canActivate(event({ status }))).toBe(false);
  });

  it('can activate once ready with photos', () => {
    expect(canActivate(event())).toBe(true);
  });

  it('cannot activate a ready folder with no photos', () => {
    expect(canActivate(event({ photosTotal: 0 }))).toBe(false);
  });
});

describe('toEventSummary', () => {
  it('never includes drive fields or the slug', () => {
    const json = JSON.stringify(toEventSummary(event()));
    expect(json).not.toContain('DRIVE_SECRET_ID');
    expect(json).not.toMatch(/drive/i);
  });
});
