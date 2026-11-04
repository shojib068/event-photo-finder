import { useEffect } from 'react';
import { messages } from '../../../shared/content';
import type { PhotoMatch } from '../../../shared/face-index';
import { Button, Notice } from '../../../shared/ui';
import { useFaceSearch } from '../hooks/useFaceSearch';

const t = messages.processing;

interface Props {
  eventId: string;
  indexPath: string;
  descriptor: number[];
  onDone: (matches: PhotoMatch[]) => void;
  onRetry: () => void;
}

/** Processing screen: downloads the event index and compares faces, with live progress. */
export function FaceSearch({ eventId, indexPath, descriptor, onDone, onRetry }: Props) {
  const state = useFaceSearch(eventId, indexPath, descriptor);

  useEffect(() => {
    if (state.status === 'done') onDone(state.matches);
  }, [state, onDone]);

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <Notice tone="error">{t.failed}</Notice>
        <Button onClick={onRetry}>{t.tryAgain}</Button>
      </div>
    );
  }

  const share = progressShare(state);
  return (
    <div className="space-y-6 py-6 text-center" aria-live="polite">
      <span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p className="text-stone-600">{state.status === 'loading-index' ? t.loadingIndex : t.comparing}</p>
      <div className="h-3 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={share === null ? undefined : Math.round(share * 100)}>
        <div className={`h-full bg-rose-600 transition-all ${share === null ? 'w-1/3 animate-pulse' : ''}`} style={share === null ? undefined : { width: `${Math.round(share * 100)}%` }} />
      </div>
      {state.status !== 'loading-index' && (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label={t.photos} value={state.photoCount} />
          {state.status === 'matching' && <Stat label={t.facesChecked} value={`${state.facesChecked} / ${state.totalFaces}`} />}
        </dl>
      )}
    </div>
  );
}

function progressShare(state: ReturnType<typeof useFaceSearch>): number | null {
  if (state.status === 'loading-index') return state.share === null ? null : state.share * 0.3;
  if (state.status === 'matching') return 0.3 + 0.7 * (state.totalFaces ? state.facesChecked / state.totalFaces : 1);
  return 1;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
