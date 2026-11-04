'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { messages } from '@/shared/content';
import { useMatch } from '../hooks/match-context';

/** G1: welcome text, privacy note and Start. Never opens the camera. */
export function WelcomeScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { reset } = useMatch();

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <main className="screen">
      <div className="stack">
        <h1>{messages.guest.welcomeTitle}</h1>
        <p>{messages.guest.welcomeBody}</p>
        <p className="muted">{messages.guest.privacyNote}</p>
        <button type="button" className="btn btn--primary btn--block" onClick={() => router.push(`/e/${slug}/selfie`)}>
          {messages.guest.start}
        </button>
      </div>
    </main>
  );
}
