'use client';

import { messages } from '@/shared/content';

/**
 * G0: one identical message for unknown, not Ready and switched-off links.
 * No Start button, never opens the camera, shows no link or Drive details.
 */
export function NotAvailableScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <main className="screen">
      <div className="stack">
        <h1>{messages.guest.notAvailableTitle}</h1>
        <p className="muted">{messages.guest.notAvailableBody}</p>
        {onRetry && (
          <button type="button" className="btn btn--secondary btn--block" onClick={onRetry}>
            {messages.guest.tryAgain}
          </button>
        )}
      </div>
    </main>
  );
}
