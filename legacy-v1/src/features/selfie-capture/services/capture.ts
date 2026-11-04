import { SELFIE_JPEG_QUALITY, SELFIE_MAX_EDGE } from '../constants';
import { fitWithin } from './downscale';

/**
 * Draws the current video frame to an off-DOM canvas, downscaled, as JPEG.
 * The canvas is cleared and released afterwards; nothing touches storage.
 */
export async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const { width, height } = fitWithin(video.videoWidth, video.videoHeight, SELFIE_MAX_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(video, 0, 0, width, height);
  try {
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Capture failed'))), 'image/jpeg', SELFIE_JPEG_QUALITY),
    );
  } finally {
    ctx.clearRect(0, 0, width, height);
    canvas.width = 0;
    canvas.height = 0;
  }
}
