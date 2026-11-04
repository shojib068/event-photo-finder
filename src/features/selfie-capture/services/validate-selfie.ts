import type { DetectedFace } from '../../../shared/face-engine';

export type SelfieCheck = { ok: true; face: DetectedFace } | { ok: false; reason: 'no-face' | 'many-faces' | 'too-small' };

/** Minimum face width as a share of the selfie width. */
const MIN_FACE_SHARE = 0.15;
/** A second face this much smaller than the main one is treated as background. */
const BACKGROUND_FACE_RATIO = 0.5;

/** Accepts exactly one prominent face. Faces must be sorted largest first. */
export function validateSelfie(faces: DetectedFace[], imageWidth: number): SelfieCheck {
  const [main, second] = faces;
  if (!main) return { ok: false, reason: 'no-face' };
  if (second && second.widthPx > main.widthPx * BACKGROUND_FACE_RATIO) return { ok: false, reason: 'many-faces' };
  if (main.widthPx < imageWidth * MIN_FACE_SHARE) return { ok: false, reason: 'too-small' };
  return { ok: true, face: main };
}
