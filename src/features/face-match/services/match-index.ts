import { faceSimilarity } from '../../../shared/face-engine';
import { decodeDescriptor, type FaceIndex, type PhotoMatch } from '../../../shared/face-index';

export interface MatchProgress {
  facesChecked: number;
  totalFaces: number;
}

export interface MatchOptions {
  threshold: number;
  batchSize: number;
  onProgress?: (progress: MatchProgress) => void;
  /** Lets the UI repaint between batches. */
  yieldToUi?: () => Promise<void>;
  signal?: AbortSignal;
}

export function countFaces(index: FaceIndex): number {
  return index.photos.reduce((sum, photo) => sum + photo.faces.length, 0);
}

/**
 * Compares one selfie descriptor with every face in the event's index, in batches.
 * A photo matches when any of its faces reaches the threshold; results are sorted by similarity.
 */
export async function matchIndex(index: FaceIndex, selfie: ArrayLike<number>, options: MatchOptions): Promise<PhotoMatch[]> {
  const totalFaces = countFaces(index);
  const best = new Map<number, number>();
  let facesChecked = 0;
  let sinceYield = 0;
  for (let p = 0; p < index.photos.length; p++) {
    for (const face of index.photos[p]?.faces ?? []) {
      const score = faceSimilarity(selfie, decodeDescriptor(face));
      if (score >= options.threshold && score > (best.get(p) ?? 0)) best.set(p, score);
      facesChecked++;
      if (++sinceYield >= options.batchSize) {
        sinceYield = 0;
        if (options.signal?.aborted) throw new DOMException('Search cancelled', 'AbortError');
        options.onProgress?.({ facesChecked, totalFaces });
        await options.yieldToUi?.();
      }
    }
  }
  options.onProgress?.({ facesChecked, totalFaces });
  return [...best.entries()]
    .map(([p, score]) => ({ photo: index.photos[p]!, score: Number(score.toFixed(4)) }))
    .sort((a, b) => b.score - a.score);
}
