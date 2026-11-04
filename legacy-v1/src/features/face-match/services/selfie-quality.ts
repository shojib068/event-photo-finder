import type { DetectedFace } from '@/shared/face-provider';
import { COUNTED_FACE_DET_SCORE, MIN_FACE_WIDTH_RATIO, MIN_SELFIE_DET_SCORE } from '../constants';
import type { SelfieQualityCode } from '../types';

/** Server check on the embed result before matching. Returns the face to use, or an error code. */
export function checkSelfieQuality(
  faces: DetectedFace[],
  imageWidth: number,
): { ok: true; face: DetectedFace } | { ok: false; code: SelfieQualityCode } {
  const counted = faces.filter((f) => f.detScore >= COUNTED_FACE_DET_SCORE);
  if (counted.length === 0) return { ok: false, code: 'NO_FACE' };
  if (counted.length > 1) return { ok: false, code: 'MULTIPLE_FACES' };
  const face = counted[0]!;
  if (face.detScore < MIN_SELFIE_DET_SCORE || face.bbox[2] < imageWidth * MIN_FACE_WIDTH_RATIO) {
    return { ok: false, code: 'LOW_QUALITY' };
  }
  return { ok: true, face };
}
