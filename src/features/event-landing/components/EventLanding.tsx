import { useId, useState } from 'react';
import type { PublicEventMeta } from '../../../shared/events';
import { messages } from '../../../shared/content';
import { Button, Notice } from '../../../shared/ui';

const t = messages.landing;

/** Event landing page: explains the process, shows privacy info and collects consent. */
export function EventLanding({ meta, onStart }: { meta: PublicEventMeta; onStart: () => void }) {
  const [consented, setConsented] = useState(false);
  const consentId = useId();
  const searchable = meta.indexed && meta.photoCount > 0;

  return (
    <div className="space-y-6">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{meta.name}</h1>
        <p className="text-stone-600">{t.intro}</p>
      </section>

      <ol className="space-y-3">
        {t.steps.map((step, i) => (
          <li key={step} className="flex gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <section className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
        <h2 className="mb-2 font-semibold">{t.privacyTitle}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
          {t.privacy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {searchable ? (
        <div className="space-y-4">
          <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3 text-sm">
            <input id={consentId} type="checkbox" className="mt-0.5 h-5 w-5 accent-rose-600" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
            <span>{t.consent}</span>
          </label>
          <Button className="w-full" disabled={!consented} onClick={onStart}>
            {t.start}
          </Button>
        </div>
      ) : (
        <Notice>{t.notIndexed}</Notice>
      )}
    </div>
  );
}
