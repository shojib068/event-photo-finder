'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { messages } from '@/shared/content';
import { isSelfieQualityError, useMatch } from '../hooks/match-context';
import { NotAvailableScreen } from './NotAvailableScreen';

/** G3: waits for the match request started by Selfie, then routes by result. */
export function SearchingScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { state, reset } = useMatch();

  useEffect(() => {
    switch (state.phase) {
      case 'idle':
        router.replace(`/e/${slug}/selfie`);
        break;
      case 'match':
        router.replace(`/g/${state.token}`);
        break;
      case 'no-match':
        router.replace(`/e/${slug}/no-match`);
        break;
      case 'error':
        // Keep the state: Selfie reads it to show the retake message.
        if (isSelfieQualityError(state.code)) router.replace(`/e/${slug}/selfie`);
        break;
      default:
        break;
    }
  }, [state, router, slug]);

  if (state.phase === 'error') {
    if (state.code === 'NOT_AVAILABLE') return <NotAvailableScreen />;
    if (isSelfieQualityError(state.code)) return null;
    const text =
      state.code === 'FACE_SERVICE_DOWN'
        ? messages.guest.FACE_SERVICE_DOWN
        : state.code === 'TOO_MANY_REQUESTS'
          ? messages.guest.TOO_MANY_REQUESTS
          : messages.guest.genericError;
    return (
      <main className="screen">
        <div className="stack">
          <p className="alert" role="alert">
            {text}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              reset();
              router.push(`/e/${slug}/selfie`);
            }}
          >
            {messages.guest.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  if (state.phase !== 'pending') return null;

  return (
    <main className="screen">
      <div className="stack" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{messages.guest.searching}</p>
      </div>
    </main>
  );
}
