const MAX_SIDE = 960;

/** Draws the current video frame (un-mirrored) into a new canvas, downscaled for detection. */
export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Wipes and shrinks a canvas so the selfie pixels are released. */
export function clearCanvas(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
}
