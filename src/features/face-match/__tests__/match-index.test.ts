import { describe, expect, it } from 'vitest';
import { encodeDescriptor, type FaceIndex, type IndexedPhoto } from '../../../shared/face-index';
import { countFaces, matchIndex } from '..';

const base = Array.from({ length: 64 }, (_, i) => 2 + 0.3 * Math.sin(i));
// similarity = (1 - 40*delta/100 - 0.2) / 0.6 for 64 dims
const shifted = (delta: number) => base.map((v, i) => v + (i % 2 ? delta : -delta));
const face = (values: number[]) => ({ box: [0, 0, 0.1, 0.1] as [number, number, number, number], score: 1, ...encodeDescriptor(values) });
const photo = (id: string, faces: number[][]): IndexedPhoto => ({ id, ref: id, name: id, mimeType: 'image/jpeg', width: 1, height: 1, takenAt: null, checksum: id, faces: faces.map(face) });

const index: FaceIndex = {
  version: 1,
  eventId: 'wedding-2026',
  eventName: 'W',
  generatedAt: '',
  model: 'm',
  descriptorLength: 64,
  photos: [photo('stranger', [shifted(1.5)]), photo('group', [shifted(1.5), shifted(0.6)]), photo('solo', [base]), photo('empty', [])],
};

describe('matchIndex', () => {
  it('returns photos with any face above threshold, best first', async () => {
    const results = await matchIndex(index, base, { threshold: 0.8, batchSize: 1 });
    expect(results.map((r) => r.photo.id)).toEqual(['solo', 'group']);
    expect(results[0]!.score).toBeGreaterThanOrEqual(results[1]!.score);
  });

  it('reports progress over every face', async () => {
    const seen: number[] = [];
    await matchIndex(index, base, { threshold: 0.8, batchSize: 2, onProgress: (p) => seen.push(p.facesChecked) });
    expect(countFaces(index)).toBe(4);
    expect(seen.at(-1)).toBe(4);
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(matchIndex(index, base, { threshold: 0.8, batchSize: 1, signal: controller.signal })).rejects.toThrow('cancelled');
  });
});
