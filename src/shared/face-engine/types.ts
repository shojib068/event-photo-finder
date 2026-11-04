import type { NormalizedBox } from '../face-index';

export interface DetectedFace {
  box: NormalizedBox;
  /** Face width in source pixels; small faces give unreliable descriptors. */
  widthPx: number;
  score: number;
  descriptor: number[];
}

/** Provider interface so the face model can be swapped without touching features. */
export interface FaceEngine {
  readonly modelId: string;
  detect(input: HTMLCanvasElement | HTMLVideoElement | unknown): Promise<DetectedFace[]>;
}
