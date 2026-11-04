'use client';

import type { ReactNode } from 'react';
import { messages } from '@/shared/content';
import { useEventAvailability } from '../hooks/use-event-availability';
import { NotAvailableScreen } from './NotAvailableScreen';

/** Renders children only when the link is Ready and Active, so the camera never opens otherwise. */
export function AvailabilityGate({ slug, children }: { slug: string; children: ReactNode }) {
  const { state, recheck } = useEventAvailability(slug);

  if (state === 'loading') {
    return (
      <main className="screen" aria-busy="true">
        <div className="stack">
          <div className="spinner" aria-hidden="true" />
          <p className="muted" role="status">{messages.guest.loading}</p>
        </div>
      </main>
    );
  }
  if (state === 'unavailable') return <NotAvailableScreen onRetry={recheck} />;
  if (state === 'error') {
    return (
      <main className="screen">
        <div className="stack">
          <p className="alert" role="alert">{messages.guest.genericError}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={recheck}>
            {messages.guest.tryAgain}
          </button>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
