import type { DetectedFace } from '@/shared/face-provider';
import { MIN_INDEX_DET_SCORE, MIN_INDEX_FACE_PX } from '../constants';

/** Keeps faces worth indexing: confident detection and short side >= 40 px. */
export function filterIndexableFaces(faces: DetectedFace[]): DetectedFace[] {
  return faces.filter((f) => f.detScore >= MIN_INDEX_DET_SCORE && Math.min(f.bbox[2], f.bbox[3]) >= MIN_INDEX_FACE_PX);
}

const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']);

export function isSupportedImage(mimeType: string): boolean {
  return SUPPORTED_MIME.has(mimeType.toLowerCase());
}
