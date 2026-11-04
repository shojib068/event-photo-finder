export type CameraError = 'denied' | 'unavailable' | 'insecure';

export function toCameraError(error: unknown): CameraError {
  const name = error instanceof DOMException || error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  return 'unavailable';
}
