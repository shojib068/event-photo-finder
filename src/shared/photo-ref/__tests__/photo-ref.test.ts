import { describe, expect, it } from 'vitest';
import { createPhotoRef, openPhotoRef, photoUrl } from '..';

const SECRET = 'x'.repeat(40);
const FILE = '1AbCdEfGhIjKlMnOpQrStUvWxYz';

describe('photo refs', () => {
  it('round-trips and never contains the Drive ID', async () => {
    const ref = await createPhotoRef(SECRET, 'wedding-2026', FILE);
    expect(ref).not.toContain(FILE);
    expect(await openPhotoRef(SECRET, 'wedding-2026', ref)).toBe(FILE);
  });

  it('is bound to its event (isolation)', async () => {
    const ref = await createPhotoRef(SECRET, 'wedding-2026', FILE);
    expect(await openPhotoRef(SECRET, 'cu-reunion', ref)).toBeNull();
  });

  it('rejects tampering, wrong secret and junk', async () => {
    const ref = await createPhotoRef(SECRET, 'wedding-2026', FILE);
    const tampered = ref.slice(0, -2) + (ref.endsWith('A') ? 'BB' : 'AA');
    expect(await openPhotoRef(SECRET, 'wedding-2026', tampered)).toBeNull();
    expect(await openPhotoRef('y'.repeat(40), 'wedding-2026', ref)).toBeNull();
    expect(await openPhotoRef(SECRET, 'wedding-2026', '../../etc/passwd')).toBeNull();
  });

  it('refuses short secrets', async () => {
    await expect(createPhotoRef('short', 'wedding-2026', FILE)).rejects.toThrow();
  });

  it('builds proxy URLs', () => {
    expect(photoUrl('wedding-2026', 'abc', 'full', true)).toBe('/api/photo/wedding-2026/abc?size=full&download=1');
  });
});
