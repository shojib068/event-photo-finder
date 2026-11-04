import { describe, expect, it } from 'vitest';
import { chunk, fileNameFromDisposition, mapLimit } from '../hooks/photo-files';

describe('chunk', () => {
  it('splits into groups and keeps the remainder', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('returns no groups for an empty list', () => {
    expect(chunk([], 20)).toEqual([]);
  });
});

describe('mapLimit', () => {
  it('keeps order and never exceeds the limit', async () => {
    let running = 0;
    let peak = 0;
    const out = await mapLimit([30, 10, 20, 5, 15], 2, async (ms, i) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, ms));
      running--;
      return i * 10;
    });
    expect(out).toEqual([0, 10, 20, 30, 40]);
    expect(peak).toBe(2);
  });
  it('rejects when one item fails', async () => {
    await expect(mapLimit([1, 2], 2, async (n) => {
      if (n === 2) throw new Error('boom');
      return n;
    })).rejects.toThrow('boom');
  });
});

describe('fileNameFromDisposition', () => {
  it('reads the quoted file name', () => {
    expect(fileNameFromDisposition('attachment; filename="IMG_1.HEIC"', 'x.jpg')).toBe('IMG_1.HEIC');
  });
  it('falls back when missing', () => {
    expect(fileNameFromDisposition(null, 'photo-1.jpg')).toBe('photo-1.jpg');
    expect(fileNameFromDisposition('attachment', 'photo-1.jpg')).toBe('photo-1.jpg');
  });
});
