'use client';

import type { GalleryPhoto } from '../types';
import { messages } from '@/shared/content';
import styles from './Gallery.module.css';

interface Props {
  photos: GalleryPhoto[];
  thumbUrl: (id: string) => string;
  onOpen: (index: number, trigger: HTMLElement) => void;
}

/** Square lazy-loaded thumbnails; each is a button that opens the viewer. */
export function GalleryGrid({ photos, thumbUrl, onOpen }: Props) {
  return (
    <ul className={styles.grid}>
      {photos.map((p, i) => (
        <li key={p.id}>
          <button type="button" className={styles.thumb} onClick={(e) => onOpen(i, e.currentTarget)}>
            {/* Plain img: authenticated app stream, not optimisable by next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl(p.id)}
              alt={messages.guest.photoAlt(i + 1, photos.length)}
              loading="lazy"
              decoding="async"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
