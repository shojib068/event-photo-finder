'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '@/shared/api-client';
import { SelfieHandoffProvider, type SelfieHandoff } from '@/shared/selfie-handoff';
import { MATCH_TIMEOUT_MS } from '../constants';
import type { MatchErrorCode, MatchResponse, MatchState } from '../types';

interface MatchContextValue {
  state: MatchState;
  /** Sends the selfie (in memory) to the match endpoint. Resolves when the search finishes. */
  submit(selfie: Blob): Promise<void>;
  /** Back to idle (Try again / Retake). */
  reset(): void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

const KNOWN_CODES: MatchErrorCode[] = [
  'NO_FACE', 'MULTIPLE_FACES', 'LOW_QUALITY', 'NOT_AVAILABLE', 'FACE_SERVICE_DOWN', 'TOO_MANY_REQUESTS',
];

function toErrorCode(err: unknown): MatchErrorCode {
  if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) return 'TIMEOUT';
  if (err instanceof ApiError) {
    if (err.status === 429) return 'TOO_MANY_REQUESTS';
    return (KNOWN_CODES as string[]).includes(err.code) ? (err.code as MatchErrorCode) : 'UNKNOWN';
  }
  return 'UNKNOWN';
}

async function postSelfie(slug: string, selfie: Blob): Promise<MatchResponse> {
  const form = new FormData();
  form.append('selfie', selfie, 'selfie.jpg');
  const res = await fetch(`/api/e/${slug}/match`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
    signal: AbortSignal.timeout(MATCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    throw new ApiError(res.status, body.error?.code ?? 'UNKNOWN');
  }
  return (await res.json()) as MatchResponse;
}

/**
 * Holds the current search in React memory only (never storage, URL or router state).
 * Mount once per guest flow (the /e/[slug] layout) so it survives step navigation.
 */
export function MatchProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [state, setState] = useState<MatchState>({ phase: 'idle' });
  const requestId = useRef(0);

  const submit = useCallback(
    async (selfie: Blob) => {
      const id = ++requestId.current;
      setState({ phase: 'pending' });
      try {
        const result = await postSelfie(slug, selfie);
        if (id !== requestId.current) return;
        setState(result.match ? { phase: 'match', token: result.token } : { phase: 'no-match' });
      } catch (err) {
        if (id !== requestId.current) return;
        setState({ phase: 'error', code: toErrorCode(err) });
      }
    },
    [slug],
  );

  const reset = useCallback(() => {
    requestId.current += 1;
    setState({ phase: 'idle' });
  }, []);

  const value = useMemo(() => ({ state, submit, reset }), [state, submit, reset]);
  const handoff = useMemo<SelfieHandoff>(
    () => ({
      submit: (selfie) => void submit(selfie),
      retakeReason: state.phase === 'error' && isSelfieQualityError(state.code) ? state.code : null,
      clear: reset,
    }),
    [state, submit, reset],
  );
  return (
    <MatchContext.Provider value={value}>
      <SelfieHandoffProvider value={handoff}>{children}</SelfieHandoffProvider>
    </MatchContext.Provider>
  );
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside <MatchProvider>');
  return ctx;
}

/** Errors that mean "retake the selfie" rather than a generic failure. */
export function isSelfieQualityError(code: MatchErrorCode): code is 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY' {
  return code === 'NO_FACE' || code === 'MULTIPLE_FACES' || code === 'LOW_QUALITY';
}
