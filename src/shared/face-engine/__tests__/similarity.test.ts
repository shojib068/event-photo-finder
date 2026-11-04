import { describe, expect, it } from 'vitest';
import { faceSimilarity, toDetectedFaces, type RawFace } from '..';

describe('faceSimilarity', () => {
  it('is 1 for identical and drops with distance', () => {
    const a = Array.from({ length: 8 }, () => 0.5);
    expect(faceSimilarity(a, a)).toBe(1);
    const near = a.map((v) => v + 2); // root distance 28.3 -> 0.862
    const far = a.map((v) => v + 4); // root distance 56.6 -> 0.390
    expect(faceSimilarity(a, near)).toBeGreaterThan(faceSimilarity(a, far));
    expect(faceSimilarity(a, [1])).toBe(0);
  });

  it('matches Human match.similarity on a known pair', () => {
    // distance = 25 * (4 * 5^2) = 2500 → root 50 → (1 - 0.5 - 0.2) / 0.6 = 0.5
    expect(faceSimilarity([0, 0, 0, 0], [5, 5, 5, 5])).toBeCloseTo(0.5, 6);
  });
});

describe('toDetectedFaces', () => {
  const face = (w: number, embedding?: number[]): RawFace => ({ score: 0.9, box: [0, 0, w, w], boxRaw: [0.1, 0.2, 0.3, 1.2], embedding });

  it('drops small faces and faces without descriptor, largest first, clamps boxes', () => {
    const out = toDetectedFaces([face(50, [1]), face(20, [1]), face(200, [1]), face(300)]);
    expect(out.map((f) => f.widthPx)).toEqual([200, 50]);
    expect(out[0]?.box[3]).toBe(1);
  });
});
