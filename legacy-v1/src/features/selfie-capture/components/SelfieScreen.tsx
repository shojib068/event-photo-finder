"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { messages } from "@/shared/content";
import { useSelfieHandoff } from "@/shared/selfie-handoff";
import { useCamera } from "../hooks/use-camera";
import styles from "./SelfieScreen.module.css";

/** G2: live front-camera preview, capture, retake / use. The selfie stays in memory only. */
export function SelfieScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const handoff = useSelfieHandoff();
  const { videoRef, status, captured, start, capture, discard } = useCamera();
  const [needsPlay, setNeedsPlay] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    if (status === "live") setNeedsPlay(videoRef.current?.paused ?? false);
  }, [status, videoRef]);

  const playManually = async () => {
    try {
      await videoRef.current?.play();
      setNeedsPlay(false);
    } catch {
      /* stays visible so the guest can tap again */
    }
  };

  const onCapture = async () => {
    handoff.clear();
    await capture();
  };

  const onRetake = () => {
    discard();
    void start();
  };

  const onUse = () => {
    if (!captured) return;
    handoff.submit(captured.blob);
    discard();
    router.push(`/e/${slug}/searching`);
  };

  const live = status === "live";
  const message =
    status === "denied"
      ? messages.guest.cameraPermissionDenied
      : status === "unsupported"
        ? messages.guest.cameraUnsupported
        : status === "insecure"
          ? messages.guest.cameraNeedsHttps
          : status === "error"
            ? messages.guest.genericError
            : null;
  const canRetry = status === "denied" || status === "error";
  const showCamera = !captured && !message;

  return (
    <main className="screen screen--top">
      <div className="stack">
        {handoff.retakeReason && !captured && (
          <p className="alert" role="alert">
            {messages.guest[handoff.retakeReason]}
          </p>
        )}

        {message && (
          <div className="stack">
            <p className="alert" role="alert">
              {message}
            </p>
            {canRetry && (
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => void start()}
              >
                {messages.guest.tryAgain}
              </button>
            )}
          </div>
        )}

        <div
          className={`${styles.frame} ${showCamera ? "" : styles.collapsed}`}
        >
          <video
            ref={videoRef}
            className={`${styles.media} ${styles.mirrored} ${live ? "" : styles.dim}`}
            playsInline
            muted
            autoPlay
          />
          {live && <div className={styles.guide} aria-hidden="true" />}
          {status === "starting" && (
            <div className={styles.overlay} role="status">
              <div className="spinner" />
              <p>{messages.guest.cameraStarting}</p>
            </div>
          )}
          {live && needsPlay && (
            <div className={styles.overlay}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void playManually()}
              >
                {messages.guest.startCamera}
              </button>
            </div>
          )}
        </div>

        {captured && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={captured.previewUrl}
              alt=""
              className={`${styles.frame} ${styles.mirrored}`}
              style={{ objectFit: "cover" }}
            />
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={onRetake}
              >
                {messages.guest.retake}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={onUse}
              >
                {messages.guest.useThisPhoto}
              </button>
            </div>
          </>
        )}

        {showCamera && (
          <>
            <p className="muted">{messages.guest.selfieTip}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!live || needsPlay}
                onClick={() => void onCapture()}
              >
                {messages.guest.capture}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
