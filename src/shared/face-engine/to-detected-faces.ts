import type { NormalizedBox } from '../face-index';
import { MIN_FACE_WIDTH_PX } from './constants';
import type { DetectedFace } from './types';

/** Minimal shape of a Human face result that we rely on. */
export interface RawFace {
  score: number;
  box: [number, number, number, number];
  boxRaw: [number, number, number, number];
  embedding?: number[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Keeps faces with a descriptor that are large enough, largest first. */
export function toDetectedFaces(faces: RawFace[], minWidthPx = MIN_FACE_WIDTH_PX): DetectedFace[] {
  return faces
    .filter((f) => Array.isArray(f.embedding) && f.embedding.length > 0 && f.box[2] >= minWidthPx)
    .map((f) => ({
      box: f.boxRaw.map((v) => Number(clamp01(v).toFixed(4))) as NormalizedBox,
      widthPx: Math.round(f.box[2]),
      score: Number(f.score.toFixed(3)),
      descriptor: Array.from(f.embedding as number[]),
    }))
    .sort((a, b) => b.widthPx - a.widthPx);
}
