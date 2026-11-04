import { describe, expect, it, vi } from 'vitest';
import { loadEvent } from '..';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const meta = { id: 'wedding-2026', name: 'Wedding', indexPath: '/indexes/wedding-2026.json', indexed: true, photoCount: 1, faceCount: 1, indexedAt: null };

describe('loadEvent', () => {
  it('loads only the requested event', async () => {
    const fetchFn = vi.fn(async () => json(meta));
    expect(await loadEvent('wedding-2026', fetchFn)).toEqual({ status: 'ok', meta });
    expect(fetchFn).toHaveBeenCalledWith('/events/wedding-2026.json', expect.anything());
  });

  it('rejects invalid ids without a request', async () => {
    const fetchFn = vi.fn();
    expect(await loadEvent('../secret', fetchFn)).toEqual({ status: 'not-found' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('treats 404, HTML fallback and mismatched ids as not found', async () => {
    expect(await loadEvent('wedding-2026', async () => new Response('', { status: 404 }))).toEqual({ status: 'not-found' });
    expect(await loadEvent('wedding-2026', async () => new Response('<html>', { headers: { 'content-type': 'text/html' } }))).toEqual({ status: 'not-found' });
    expect(await loadEvent('wedding-2026', async () => json({ ...meta, id: 'other-1' }))).toEqual({ status: 'not-found' });
  });

  it('reports network errors', async () => {
    expect(await loadEvent('wedding-2026', async () => Promise.reject(new Error('offline')))).toEqual({ status: 'error' });
  });
});
