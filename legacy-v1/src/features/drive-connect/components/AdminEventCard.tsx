'use client';

import { useState } from 'react';
import { messages } from '@/shared/content';
import type { AdminEventRow } from '@/shared/api-types';
import styles from './Admin.module.css';

interface Props {
  event: AdminEventRow;
  saving: boolean;
  saveFailed: boolean;
  onToggle: (id: string, active: boolean) => void;
  onRetry: (id: string) => Promise<void>;
}

const STATUS_TEXT = {
  pending: messages.admin.statusQueued,
  indexing: messages.admin.statusIndexing,
  ready: messages.admin.statusReady,
  failed: messages.admin.statusFailed,
} as const;

/** One Drive link: name, status, QR (when ready) and the Active switch. */
export function AdminEventCard({ event, saving, saveFailed, onToggle, onRetry }: Props) {
  const [retryFailed, setRetryFailed] = useState(false);
  const { id, folderName, status, noPhotos } = event;
  const canToggle = status === 'ready' && !noPhotos;
  const badgeClass = [styles.badge, status === 'ready' && styles.badgeReady, status === 'failed' && styles.badgeFailed]
    .filter(Boolean)
    .join(' ');
  const labelId = `active-label-${id}`;

  const retry = () => {
    setRetryFailed(false);
    onRetry(id).catch(() => setRetryFailed(true));
  };

  return (
    <li className={`card ${styles.item}`}>
      <div className={styles.top}>
        <h2 className={styles.name}>{folderName}</h2>
        <span className={badgeClass}>{STATUS_TEXT[status]}</span>
      </div>

      {status === 'indexing' && event.photosTotal > 0 && (
        <p className="muted">{messages.admin.progress(event.photosDone, event.photosTotal)}</p>
      )}

      {status === 'failed' && (
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={retry}>
            {messages.admin.retry}
          </button>
          {retryFailed && <p className="alert" role="alert">{messages.admin.UNKNOWN}</p>}
        </div>
      )}

      {status === 'ready' && noPhotos && <p className="alert" role="alert">{messages.admin.noPhotos}</p>}

      {status === 'ready' && !noPhotos && event.qrUrl && (
        <div className={styles.qr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- same-origin generated PNG; next/image optimisation not needed */}
          <img src={event.qrUrl} width={160} height={160} alt={messages.admin.qrAlt(folderName)} />
          <div className={styles.qrInfo}>
            <a className="btn btn--secondary" href={event.qrUrl} download={`qr-${folderName}.png`}>
              {messages.admin.downloadQr}
            </a>
            {event.guestUrl && <p className={`muted small ${styles.url}`}>{event.guestUrl}</p>}
          </div>
        </div>
      )}

      <div className={styles.activeRow}>
        <button
          type="button"
          role="switch"
          aria-checked={event.active}
          aria-labelledby={labelId}
          className={`switch ${styles.switch}`}
          disabled={!canToggle || saving}
          onClick={() => onToggle(id, !event.active)}
        />
        <span id={labelId}>{messages.admin.active}</span>
        {saving && <span className="muted" role="status">{messages.admin.saving}</span>}
      </div>
      {saveFailed && <p className="alert" role="alert">{messages.admin.saveError}</p>}
    </li>
  );
}
