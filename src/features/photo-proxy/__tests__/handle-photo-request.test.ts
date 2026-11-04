import { describe, expect, it } from 'vitest';
import { createPhotoRef } from '../../../shared/photo-ref';
import { handlePhotoRequest } from '..';

const env = { GOOGLE_SERVICE_ACCOUNT_JSON: '{}', PHOTO_REF_SECRET: 's'.repeat(40) };
const get = (path = '/api/photo/x/y') => new Request(`https://site.test${path}`);

describe('handlePhotoRequest (no Drive calls needed)', () => {
  it('503 when not configured', async () => {
    expect((await handlePhotoRequest(get(), { eventId: 'wedding-2026', ref: 'x' }, {})).status).toBe(503);
  });

  it('404 for invalid event ids and bad refs', async () => {
    expect((await handlePhotoRequest(get(), { eventId: '../x', ref: 'x' }, env)).status).toBe(404);
    expect((await handlePhotoRequest(get(), { eventId: 'wedding-2026', ref: 'not-a-ref' }, env)).status).toBe(404);
  });

  it('404 when a ref from another event is used (isolation)', async () => {
    const ref = await createPhotoRef(env.PHOTO_REF_SECRET, 'cu-reunion', 'FILEID12345');
    expect((await handlePhotoRequest(get(), { eventId: 'wedding-2026', ref }, env)).status).toBe(404);
  });

  it('405 for non-GET', async () => {
    const post = new Request('https://site.test/api/photo/a/b', { method: 'POST' });
    expect((await handlePhotoRequest(post, { eventId: 'wedding-2026', ref: 'x' }, env)).status).toBe(405);
  });
});
