import { describe, expect, it } from 'vitest';
import type { EventRecord } from '@/shared/events';
import { buildEventUrl, renderQr } from '../services/qr';
import { setActiveWith } from '../services/set-active';

describe('buildEventUrl', () => {
  it('points to the guest page of the slug', () => {
    expect(buildEventUrl('abc', 'https://x.trycloudflare.com/')).toBe('https://x.trycloudflare.com/e/abc');
  });
});

describe('renderQr', () => {
  it('renders a PNG', async () => {
    const png = (await renderQr('https://example.com/e/abc', 'png')) as Buffer;
    expect(png.subarray(1, 4).toString()).toBe('PNG');
  });
});

describe('setActiveWith (Active switch rules)', () => {
  const base: EventRecord = {
    id: 'e1', slug: 's', driveFolderId: 'd', folderName: 'f', status: 'ready', active: false,
    photosTotal: 5, photosDone: 5, error: null, createdAt: new Date(),
  };
  const deps = (event: EventRecord | null) => ({
    findEventById: async () => event,
    setEventActive: async (_id: string, active: boolean) => (event ? { ...event, active } : null),
  });

  it.each(['pending', 'indexing', 'failed'] as const)('refuses to activate while %s', async (status) => {
    expect(await setActiveWith(deps({ ...base, status }), 'e1', true)).toEqual({ ok: false, code: 'NOT_READY' });
  });

  it('refuses to activate a folder with no photos', async () => {
    expect(await setActiveWith(deps({ ...base, photosTotal: 0 }), 'e1', true)).toEqual({ ok: false, code: 'NOT_READY' });
  });

  it('activates when ready', async () => {
    expect(await setActiveWith(deps(base), 'e1', true)).toMatchObject({ ok: true, event: { active: true } });
  });

  it('always allows switching off', async () => {
    expect(await setActiveWith(deps({ ...base, status: 'indexing', active: true }), 'e1', false)).toMatchObject({ ok: true });
  });

  it('404s an unknown event', async () => {
    expect(await setActiveWith(deps(null), 'nope', true)).toEqual({ ok: false, code: 'NOT_FOUND' });
  });
});
