import type { DetectedFace, FaceProvider } from './types';

/** Test double: returns fixed faces keyed by the image bytes (utf8). */
export class FakeFaceProvider implements FaceProvider {
  constructor(private readonly facesByImage: Record<string, DetectedFace[]> = {}) {}

  async detectAndEmbed(image: Buffer): Promise<DetectedFace[]> {
    return this.facesByImage[image.toString('utf8')] ?? [];
  }

  async health(): Promise<boolean> {
    return true;
  }
}

/** Unit vector of `dim` values pointing mostly along `axis`, rotated by `angle` toward axis+1. */
export function fakeEmbedding(axis: number, angle = 0, dim = 512): Float32Array {
  const v = new Float32Array(dim);
  v[axis % dim] = Math.cos(angle);
  v[(axis + 1) % dim] = Math.sin(angle);
  return v;
}
