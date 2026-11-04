'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { messages } from '@/shared/content';
import { useAddDriveLink } from '../hooks/use-add-drive-link';
import { useAdminEvents } from '../hooks/use-admin-events';
import { useSetActive } from '../hooks/use-set-active';
import { AdminEventCard } from './AdminEventCard';
import styles from './Admin.module.css';

/** A1: admin page. No login by spec; reached through the secret path. */
export function AdminScreen({ secret }: { secret: string }) {
  const { data, loading, error: loadError, refresh, retry } = useAdminEvents(secret);
  const { add, submitting, error: addError, clearError } = useAddDriveLink(secret, refresh);
  const { setActive, isSaving, hasError } = useSetActive(secret, refresh);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const email = data?.serviceAccountEmail ?? null;

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the email stays visible for manual copy.
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!link.trim() || submitting) return;
    if (await add(link.trim())) setLink('');
  };

  return (
    <main className="screen screen--top screen--wide">
      <header className="stack">
        <h1>{messages.admin.title}</h1>
        <section className="card stack" aria-labelledby="service-email-label">
          <p id="service-email-label" className="muted">{messages.admin.serviceEmailLabel}</p>
          {loading ? (
            <div className="spinner" role="status" aria-label={messages.admin.loading} />
          ) : email ? (
            <div className={styles.emailBox}>
              <p className={styles.email}>{email}</p>
              <button type="button" className="btn btn--secondary" onClick={() => void copyEmail()}>
                {copied ? messages.admin.copied : messages.admin.copy}
              </button>
            </div>
          ) : (
            <p className="alert">{messages.admin.serviceEmailMissing}</p>
          )}
          <p className="muted">{messages.admin.shareHelp}</p>
        </section>
      </header>

      <form className="stack" onSubmit={(e) => void submit(e)} noValidate>
        <div className={styles.form}>
          <div className={`stack ${styles.field}`}>
            <input
              className="input"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder={messages.admin.linkPlaceholder}
              aria-label={messages.admin.linkPlaceholder}
              aria-invalid={addError ? true : undefined}
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (addError) clearError();
              }}
            />
            {addError && <p className="alert" role="alert">{messages.admin[addError]}</p>}
          </div>
          <button type="submit" className="btn btn--primary" disabled={submitting || !link.trim()}>
            {submitting ? messages.admin.adding : messages.admin.add}
          </button>
        </div>
      </form>

      {loadError && <p className="alert" role="alert">{messages.admin.loadError}</p>}

      {loading ? (
        <div className="spinner" role="status" aria-label={messages.admin.loading} />
      ) : data && data.events.length === 0 ? (
        <p className="muted">{messages.admin.emptyList}</p>
      ) : (
        <ul className={styles.list}>
          {data?.events.map((event) => (
            <AdminEventCard
              key={event.id}
              event={event}
              saving={isSaving(event.id)}
              saveFailed={hasError(event.id)}
              onToggle={(id, active) => void setActive(id, active)}
              onRetry={retry}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
