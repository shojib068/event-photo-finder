import { useCallback, useEffect, useRef, useState } from 'react';
import { toCameraError, type CameraError } from '../services/camera-errors';

export type CameraState = { status: 'starting' } | { status: 'ready' } | { status: 'error'; error: CameraError };

/** Front camera stream bound to a <video>. Stops all tracks on stop/unmount. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ status: 'starting' });

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    setState({ status: 'starting' });
    if (!window.isSecureContext) return setState({ status: 'error', error: 'insecure' });
    if (!navigator.mediaDevices?.getUserMedia) return setState({ status: 'error', error: 'unavailable' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState({ status: 'ready' });
    } catch (error) {
      setState({ status: 'error', error: toCameraError(error) });
    }
  }, [stop]);

  useEffect(() => {
    void start();
    return stop;
  }, [start, stop]);

  return { videoRef, state, start, stop };
}
