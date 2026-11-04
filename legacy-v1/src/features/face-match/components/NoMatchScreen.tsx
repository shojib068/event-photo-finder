'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { messages } from '@/shared/content';
import { useMatch } from '../hooks/match-context';

/**
 * G5: shown after a search with no result. Shows no photos, counts or Drive info.
 * Without an in-memory no-match result (reload, direct visit) it redirects to Welcome.
 */
export function NoMatchScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { state, reset } = useMatch();
  const hasResult = state.phase === 'no-match';
  // Set on Try again so the reset state does not trigger the Welcome redirect below.
  const leaving = useRef(false);

  useEffect(() => {
    if (!hasResult && !leaving.current) router.replace(`/e/${slug}`);
  }, [hasResult, router, slug]);

  if (!hasResult) return null;

  return (
    <main className="screen">
      <div className="stack">
        <h1>{messages.guest.noMatch}</h1>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => {
            leaving.current = true;
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
