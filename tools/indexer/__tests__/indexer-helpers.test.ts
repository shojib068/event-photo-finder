import { describe, expect, it } from 'vitest';
import { isSupportedImage } from '../drive-client';
import { buildPhotoEntry, checksumOf, publicPhotoId } from '../photo-entry';

describe('isSupportedImage', () => {
  it('keeps jpg/jpeg/png/webp only', () => {
    expect(isSupportedImage({ name: 'a.JPG', mimeType: 'image/jpeg' })).toBe(true);
    expect(isSupportedImage({ name: 'a.webp', mimeType: 'image/webp' })).toBe(true);
    expect(isSupportedImage({ name: 'a.heic', mimeType: 'image/heic' })).toBe(false);
    expect(isSupportedImage({ name: 'a.mp4', mimeType: 'video/mp4' })).toBe(false);
  });
});

describe('photo entries', () => {
  it('public ids are stable and hide the Drive id', () => {
    const id = publicPhotoId('secret', 'wedding-2026', 'FILE123');
    expect(id).toBe(publicPhotoId('secret', 'wedding-2026', 'FILE123'));
    expect(id).not.toContain('FILE123');
  });

  it('uses rotated Drive dimensions and md5 checksums', () => {
    const image = { id: 'F', name: 'a.jpg', mimeType: 'image/jpeg', md5Checksum: 'abc', imageMediaMetadata: { width: 4000, height: 3000, rotation: 1 } };
    const entry = buildPhotoEntry({ id: 'p', ref: 'r', image, faces: [], detectionSize: { width: 1, height: 1 } });
    expect([entry.width, entry.height]).toEqual([3000, 4000]);
    expect(checksumOf(image)).toBe('abc');
    expect(JSON.stringify(entry)).not.toContain('"F"');
  });
});
