import { useEffect, useRef, useState } from 'react';
import { messages } from '../../../shared/content';
import { Button, Notice, Spinner } from '../../../shared/ui';
import { useCamera } from '../hooks/useCamera';
import { useFaceEngine } from '../hooks/useFaceEngine';
import { captureFrame, clearCanvas } from '../services/capture-frame';
import { validateSelfie } from '../services/validate-selfie';

const t = messages.selfie;
const REASON_TEXT = { 'no-face': t.noFace, 'many-faces': t.manyFaces, 'too-small': t.tooSmall } as const;
const CAMERA_TEXT = { denied: t.denied, unavailable: t.unavailable, insecure: t.insecure } as const;

type Phase = { name: 'live' } | { name: 'checking' } | { name: 'captured'; descriptor: number[] } | { name: 'rejected'; message: string };

/** Captures a selfie and hands back its face descriptor. The image itself never leaves this component. */
export function SelfieCapture({ onComplete, onCancel }: { onComplete: (descriptor: number[]) => void; onCancel: () => void }) {
  const { videoRef, state: camera, start, stop } = useCamera();
  const [engineAttempt, setEngineAttempt] = useState(0);
  const engine = useFaceEngine(engineAttempt);
  const [phase, setPhase] = useState<Phase>({ name: 'live' });
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => clearCanvas(previewRef.current), []);

  async function capture() {
    const video = videoRef.current;
    if (!video || engine.status !== 'ready' || video.videoWidth === 0) return;
    const frame = captureFrame(video);
    showPreview(frame);
    setPhase({ name: 'checking' });
    try {
      const check = validateSelfie(await engine.engine.detect(frame), frame.width);
      setPhase(check.ok ? { name: 'captured', descriptor: check.face.descriptor } : { name: 'rejected', message: REASON_TEXT[check.reason] });
    } catch {
      setPhase({ name: 'rejected', message: t.noFace });
    }
  }

  function showPreview(frame: HTMLCanvasElement) {
    clearCanvas(previewRef.current);
    frame.className = 'h-full w-full -scale-x-100 object-cover';
    previewRef.current = frame;
    holderRef.current?.replaceChildren(frame);
  }

  function retake() {
    clearCanvas(previewRef.current);
    previewRef.current = null;
    holderRef.current?.replaceChildren();
    setPhase({ name: 'live' });
  }

  function confirm() {
    if (phase.name !== 'captured') return;
    stop();
    clearCanvas(previewRef.current);
    onComplete(phase.descriptor);
  }

  if (camera.status === 'error') {
    return (
      <div className="space-y-4">
        <Notice tone="error">{CAMERA_TEXT[camera.error]}</Notice>
        <div className="flex gap-3">
          <Button onClick={() => void start()}>{t.tryAgain}</Button>
          <Button variant="secondary" onClick={onCancel}>{t.back}</Button>
        </div>
      </div>
    );
  }

  const showingStill = phase.name !== 'live';
  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold">{t.title}</h1>
      <p className="text-center text-sm text-stone-600">{t.tip}</p>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-stone-900">
        <video ref={videoRef} playsInline muted autoPlay className={`h-full w-full -scale-x-100 object-cover ${showingStill ? 'invisible' : ''}`} />
        <div ref={holderRef} className={`absolute inset-0 ${showingStill ? '' : 'hidden'}`} />
        {!showingStill && <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[45%] h-[58%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />}
        {camera.status === 'starting' && <div className="absolute inset-0 flex items-center justify-center text-white">{t.starting}</div>}
      </div>

      {engine.status === 'loading' && <Spinner label={t.loadingModel} />}
      {engine.status === 'error' && (
        <Notice tone="error">
          {t.modelFailed}{' '}
          <button type="button" className="font-semibold underline" onClick={() => setEngineAttempt((n) => n + 1)}>{t.tryAgain}</button>
        </Notice>
      )}
      {phase.name === 'checking' && <Spinner label={t.checking} />}
      {phase.name === 'rejected' && <Notice tone="error">{phase.message}</Notice>}

      <div className="flex justify-center gap-3">
        {phase.name === 'live' && (
          <Button className="w-full max-w-sm" disabled={camera.status !== 'ready' || engine.status !== 'ready'} onClick={() => void capture()}>{t.capture}</Button>
        )}
        {(phase.name === 'captured' || phase.name === 'rejected') && <Button variant="secondary" onClick={retake}>{t.retake}</Button>}
        {phase.name === 'captured' && <Button onClick={confirm}>{t.continue}</Button>}
      </div>
      <div className="text-center">
        <Button variant="ghost" onClick={onCancel}>{t.back}</Button>
      </div>
    </div>
  );
}
