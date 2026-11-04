'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GalleryPhoto } from '../types';
import { messages } from '@/shared/content';
import styles from './Gallery.module.css';

interface Props {
  photos: GalleryPhoto[];
  startIndex: number;
  fullUrl: (id: string) => string;
  downloadUrl: (id: string) => string;
  onClose: () => void;
}

const SWIPE_PX = 50;

/** Full-screen photo viewer: arrows, keyboard, swipe, single download, close. */
export function PhotoViewer({ photos, startIndex, fullUrl, downloadUrl, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const startX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = photos.length;

  const go = useCallback((d: number) => setIndex((i) => Math.min(count - 1, Math.max(0, i + d))), [count]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={messages.guest.photoAlt(index + 1, count)}>
      <div
        className={styles.stage}
        onPointerDown={(e) => {
          startX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          startX.current = null;
        }}
      >
        {/* Plain img: authenticated app stream, not optimisable by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={photo.id} src={fullUrl(photo.id)} alt={messages.guest.photoAlt(index + 1, count)} draggable={false} />
      </div>
      <div className={styles.bar}>
        <button type="button" className="btn btn--secondary" onClick={() => go(-1)} disabled={index === 0} aria-label={messages.guest.previous}>
          &#8592;
        </button>
        <a className="btn btn--primary" href={downloadUrl(photo.id)} download>
          {messages.guest.download}
        </a>
        <button type="button" className="btn btn--secondary" onClick={() => go(1)} disabled={index === count - 1} aria-label={messages.guest.next}>
          &#8594;
        </button>
      </div>
      <button ref={closeRef} type="button" className={`btn btn--secondary ${styles.close}`} onClick={onClose}>
        {messages.guest.close}
      </button>
    </div>
  );
}
