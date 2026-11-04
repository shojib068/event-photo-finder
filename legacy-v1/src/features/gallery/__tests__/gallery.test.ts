import { describe, expect, it } from 'vitest';
import { randomToken, isTokenShape } from '@/shared/tokens';
import { getGalleryWith, resolvePhotoWith, type GalleryDeps } from '../services/gallery';
import type { GalleryPhotoRecord } from '../types';

const T1 = randomToken();
const T2 = randomToken();
const photo = (id: string): GalleryPhotoRecord => ({
  id, driveFileId: `DRIVE-FILE-${id}`, fileName: `${id}.jpg`, mimeType: 'image/jpeg', width: 4000, height: 3000,
});
const P1 = '11111111-1111-4111-8111-111111111111';
const P2 = '22222222-2222-4222-8222-222222222222';

const store: Record<string, GalleryPhotoRecord[]> = { [T1]: [photo(P1)], [T2]: [photo(P2)] };
const deps: GalleryDeps = {
  findGalleryPhotos: async (t) => store[t] ?? null,
  findGalleryPhoto: async (t, id) => store[t]?.find((p) => p.id === id) ?? null,
  isTokenShape,
};

describe('gallery access by token', () => {
  it('returns only opaque ids, never Drive fields', async () => {
    const gallery = await getGalleryWith(deps, T1);
    expect(gallery?.photos).toEqual([{ id: P1, width: 4000, height: 3000 }]);
    expect(JSON.stringify(gallery)).not.toMatch(/drive/i);
  });

  it('a photo outside the token gallery is not reachable (404)', async () => {
    expect(await resolvePhotoWith(deps, T1, P2)).toBeNull();
    expect(await resolvePhotoWith(deps, T1, P1)).not.toBeNull();
  });

  it('unknown or malformed tokens return nothing', async () => {
    expect(await getGalleryWith(deps, randomToken())).toBeNull();
    expect(await getGalleryWith(deps, 'short')).toBeNull();
    expect(await resolvePhotoWith(deps, T1, '../etc/passwd')).toBeNull();
  });
});
