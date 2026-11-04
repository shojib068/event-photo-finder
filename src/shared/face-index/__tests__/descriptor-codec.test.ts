import { describe, expect, it } from 'vitest';
import { decodeDescriptor, encodeDescriptor } from '..';
import { faceSimilarity } from '../../face-engine';

const random = (seed: number) => Array.from({ length: 1024 }, (_, i) => Math.abs(Math.sin(seed * 9301 + i * 49297)) * 1.4);

describe('descriptor codec', () => {
  it('round-trips with small error and keeps similarity', () => {
    const a = random(1);
    const b = random(2);
    const decodedA = decodeDescriptor(encodeDescriptor(a));
    const maxError = Math.max(...a.map((v, i) => Math.abs(v - (decodedA[i] ?? 0))));
    expect(maxError).toBeLessThan(0.004);
    expect(Math.abs(faceSimilarity(a, b) - faceSimilarity(decodedA, decodeDescriptor(encodeDescriptor(b))))).toBeLessThan(0.01);
  });

  it('is compact: one byte per value', () => {
    expect(encodeDescriptor(random(3)).d.length).toBe(Math.ceil(1024 / 3) * 4);
  });
});
