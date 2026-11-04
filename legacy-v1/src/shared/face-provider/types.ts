export interface DetectedFace {
  embedding: Float32Array; // 512 values, L2-normalized
  bbox: [number, number, number, number]; // x, y, w, h in original pixels
  detScore: number; // 0..1
}

export interface FaceProvider {
  detectAndEmbed(image: Buffer): Promise<DetectedFace[]>;
  health(): Promise<boolean>;
}

export class FaceServiceDownError extends Error {
  constructor(cause?: unknown) {
    super('Face service unavailable', { cause });
  }
}
