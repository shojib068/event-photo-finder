export type CameraStatus = 'idle' | 'starting' | 'live' | 'denied' | 'unsupported' | 'insecure' | 'error';

/** A captured selfie, held in memory only. `previewUrl` is an object URL that must be revoked. */
export interface CapturedSelfie {
  blob: Blob;
  previewUrl: string;
}
