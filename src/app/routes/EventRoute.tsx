import { useCallback, useEffect, useState } from 'react';
import { appConfig } from '../../core/config';
import { EventLanding, useEvent } from '../../features/event-landing';
import { FaceSearch } from '../../features/face-match';
import { SearchResults } from '../../features/results';
import { SelfieCapture } from '../../features/selfie-capture';
import { messages } from '../../shared/content';
import type { PhotoMatch } from '../../shared/face-index';
import { Button, Notice, PageShell, Spinner } from '../../shared/ui';
import { NotFoundRoute } from './NotFoundRoute';

type Step = { name: 'landing' } | { name: 'selfie' } | { name: 'searching'; descriptor: number[] } | { name: 'results'; matches: PhotoMatch[] };

/** /event/:eventId — wires the feature screens together; no business logic here. */
export function EventRoute({ eventId }: { eventId: string }) {
  const { state, reload } = useEvent(eventId);
  const [step, setStep] = useState<Step>({ name: 'landing' });
  const toSelfie = useCallback(() => setStep({ name: 'selfie' }), []);
  const onDone = useCallback((matches: PhotoMatch[]) => setStep({ name: 'results', matches }), []);

  useEffect(() => {
    if (state.status === 'ok') document.title = `${state.meta.name} · ${appConfig.appName}`;
  }, [state]);
  useEffect(() => window.scrollTo(0, 0), [step.name]);

  if (state.status === 'not-found') return <NotFoundRoute />;
  const eventName = state.status === 'ok' ? state.meta.name : undefined;

  return (
    <PageShell appName={appConfig.appName} eventName={step.name === 'landing' ? undefined : eventName} wide={step.name === 'results'}>
      {state.status === 'loading' && <Spinner label="Loading…" />}
      {state.status === 'error' && (
        <div className="space-y-4">
          <Notice tone="error">{messages.errors.loadFailed}</Notice>
          <Button onClick={reload}>{messages.errors.retry}</Button>
        </div>
      )}
      {state.status === 'ok' && step.name === 'landing' && <EventLanding meta={state.meta} onStart={toSelfie} />}
      {state.status === 'ok' && step.name === 'selfie' && (
        <SelfieCapture onComplete={(descriptor) => setStep({ name: 'searching', descriptor })} onCancel={() => setStep({ name: 'landing' })} />
      )}
      {state.status === 'ok' && step.name === 'searching' && (
        <FaceSearch eventId={eventId} indexPath={state.meta.indexPath} descriptor={step.descriptor} onDone={onDone} onRetry={toSelfie} />
      )}
      {state.status === 'ok' && step.name === 'results' && <SearchResults eventId={eventId} matches={step.matches} onSearchAgain={toSelfie} />}
    </PageShell>
  );
}
