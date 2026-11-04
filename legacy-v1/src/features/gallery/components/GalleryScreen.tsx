'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { messages } from '@/shared/content';
import { useGallery } from '../hooks/use-gallery';
import { useShareLink } from '../hooks/use-share-link';
import { useSaveToPhotos } from '../hooks/use-save-to-photos';
import { GalleryGrid } from './GalleryGrid';
import { PhotoViewer } from './PhotoViewer';
import { SaveAllButton } from './SaveAllButton';
import styles from './Gallery.module.css';

/** G4: private gallery. Works from a bookmark; independent of the selfie flow. */
export function GalleryScreen({ token }: { token: string }) {
  const { state, reload, urls } = useGallery(token);
  const photoIds = useMemo(() => (state.status === 'ready' ? state.photos.map((p) => p.id) : []), [state]);
  const saver = useSaveToPhotos(photoIds, (id) => urls.photo(id, 'full', true));
  const { share, copied } = useShareLink();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const open = (i: number, el: HTMLElement) => {
    trigger.current = el;
    setOpenIndex(i);
  };
  const close = useCallback(() => {
    setOpenIndex(null);
    trigger.current?.focus();
  }, []);

  if (state.status === 'loading') {
    return (
      <main className="screen">
        <div className="stack" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>{messages.guest.loading}</p>
        </div>
      </main>
    );
  }

  if (state.status === 'not-found') {
    return (
      <main className="screen">
        <p role="alert">{messages.guest.galleryNotFound}</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="screen">
        <div className="stack">
          <p className="alert" role="alert">{messages.guest.genericError}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => void reload()}>
            {messages.guest.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  const { photos } = state;
  if (photos.length === 0) {
    return (
      <main className="screen">
        <p>{messages.guest.galleryEmpty}</p>
      </main>
    );
  }

  return (
    <main className="screen screen--top screen--wide">
      <header className={`stack ${styles.header}`}>
        <h1>{messages.guest.galleryTitle}</h1>
        <p className="muted">{messages.guest.galleryCount(photos.length)}</p>
        <div className={styles.actions}>
          {saver.supported ? (
            <SaveAllButton
              state={saver.state}
              batchCount={saver.batchCount}
              onPrepare={(b) => void saver.prepare(b)}
              onSave={(b) => void saver.save(b)}
            />
          ) : (
            <a className="btn btn--primary" href={urls.zip()} download="wedding-photos.zip">
              {messages.guest.downloadAll}
            </a>
          )}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => void share(`${window.location.origin}/g/${token}`, messages.guest.shareTitle)}
          >
            {messages.guest.share}
          </button>
        </div>
        <div aria-live="polite">
          {saver.state.status === 'unsupported' && <p className="alert" role="alert">{messages.guest.saveNotSupported}</p>}
          {saver.state.status === 'error' && <p className="alert" role="alert">{messages.guest.saveError}</p>}
          {saver.state.status === 'finished' && <p className="muted">{messages.guest.saveFinished}</p>}
          {copied && <p className="muted">{messages.guest.linkCopied}</p>}
        </div>
        {saver.supported && (
          <a className="muted small" href={urls.zip()} download="wedding-photos.zip">
            {messages.guest.downloadZip}
          </a>
        )}
        <p className="muted small">{messages.guest.bookmarkTip}</p>
      </header>
      <GalleryGrid photos={photos} thumbUrl={(id) => urls.photo(id, 'thumb')} onOpen={open} />
      {openIndex !== null && (
        <PhotoViewer
          photos={photos}
          startIndex={openIndex}
          fullUrl={(id) => urls.photo(id, 'full')}
          downloadUrl={(id) => urls.photo(id, 'full', true)}
          onClose={close}
        />
      )}
    </main>
  );
}
