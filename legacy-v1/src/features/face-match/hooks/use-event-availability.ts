'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/shared/api-client';
import type { AvailabilityResponse } from '../types';

export type AvailabilityState = 'loading' | 'available' | 'unavailable' | 'error';

/** Checks on every mount/reload whether the scanned link is Ready AND Active. */
export function useEventAvailability(slug: string) {
  const [state, setState] = useState<AvailabilityState>('loading');

  const check = useCallback(async () => {
    setState('loading');
    try {
      const res = await apiFetch<AvailabilityResponse>(`/api/e/${slug}`);
      setState(res.available ? 'available' : 'unavailable');
    } catch {
      setState('error');
    }
  }, [slug]);

  useEffect(() => {
    // Fetch on mount; state is updated after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void check();
  }, [check]);

  return { state, recheck: check };
}
