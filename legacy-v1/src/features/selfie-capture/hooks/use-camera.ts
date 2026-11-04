'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { captureFrame } from '../services/capture';
import type { CameraStatus, CapturedSelfie } from '../types';

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Front camera lifecycle + in-memory capture.
 * - `start()` must be called from a user gesture on iOS (e.g. the Start / Retake button, or on mount after one).
 * - Tracks are stopped after capture and on unmount.
 * - The captured image lives only in memory; `discard()` revokes its object URL.
 * Attach `videoRef` to a <video playsInline muted autoPlay>.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [captured, setCaptured] = useState<CapturedSelfie | null>(null);
  const capturedRef = useRef<CapturedSelfie | null>(null);
  const mountedRef = useRef(true);

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const discard = useCallback(() => {
    if (capturedRef.current) URL.revokeObjectURL(capturedRef.current.previewUrl);
    capturedRef.current = null;
    setCaptured(null);
  }, []);

  const start = useCallback(async () => {
    discard();
    if (!window.isSecureContext) return setStatus('insecure');
    if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported');
    setStatus('starting');
    try {
      stop();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (!mountedRef.current) {
        // The guest left the screen while permission was pending: never leave the camera on.
        stopStream(stream);
        return;
      }
      stopStream(streamRef.current);
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setStatus('live');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') setStatus('unsupported');
      else setStatus('error');
    }
  }, [discard, stop]);

  /** Captures a frame, stops the camera, and keeps the JPEG in memory. */
  const capture = useCallback(async (): Promise<CapturedSelfie | null> => {
    const video = videoRef.current;
    if (!video || status !== 'live') return null;
    const blob = await captureFrame(video);
    stop();
    const selfie = { blob, previewUrl: URL.createObjectURL(blob) };
    capturedRef.current = selfie;
    setCaptured(selfie);
    setStatus('idle');
    return selfie;
  }, [status, stop]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStream(streamRef.current);
      if (capturedRef.current) URL.revokeObjectURL(capturedRef.current.previewUrl);
    };
  }, []);

  return { videoRef, status, captured, start, capture, discard, stop };
}
