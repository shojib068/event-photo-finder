'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, apiJson } from '@/shared/api-client';
import { ADMIN_POLL_MS } from '../constants';
import type { AdminEventsResponse } from '@/shared/api-types';

const isBusy = (data: AdminEventsResponse) => data.events.some((e) => e.status === 'pending' || e.status === 'indexing');

/**
 * Polls the admin event list every 3 s while any row is still queued or indexing.
 * Stops once every row is ready or failed; `refresh()` loads again and restarts polling.
 */
export function useAdminEvents(secret: string) {
  const [data, setData] = useState<AdminEventsResponse | null>(null);
  const [error, setError] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      let keepPolling = true;
      try {
        const next = await apiFetch<AdminEventsResponse>(`/api/admin/${secret}/events`);
        if (cancelled) return;
        setData(next);
        setError(false);
        keepPolling = isBusy(next);
      } catch {
        if (cancelled) return;
        setError(true);
      }
      if (keepPolling && !cancelled) timer = setTimeout(tick, ADMIN_POLL_MS);
    };
    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [secret, generation]);

  const refresh = useCallback(() => setGeneration((g) => g + 1), []);

  const retry = useCallback(
    async (id: string) => {
      await apiJson(`/api/admin/${secret}/events/${id}/retry`, 'POST', {});
      refresh();
    },
    [secret, refresh],
  );

  return { data, loading: data === null && !error, error, refresh, retry };
}
