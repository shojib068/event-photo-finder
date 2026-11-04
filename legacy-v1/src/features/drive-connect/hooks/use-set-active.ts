'use client';

import { useCallback, useState } from 'react';
import { apiJson } from '@/shared/api-client';
import type { SetActiveResponse } from '@/shared/api-types';

/** Saves one row's Active switch immediately, with per-row saving and error state. */
export function useSetActive(secret: string, onSaved?: () => void) {
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const setActive = useCallback(
    async (id: string, active: boolean) => {
      setSaving((s) => ({ ...s, [id]: true }));
      setFailed((f) => ({ ...f, [id]: false }));
      try {
        await apiJson<SetActiveResponse>(`/api/admin/${secret}/events/${id}`, 'PATCH', { active });
        onSaved?.();
      } catch {
        setFailed((f) => ({ ...f, [id]: true }));
      } finally {
        setSaving((s) => ({ ...s, [id]: false }));
      }
    },
    [secret, onSaved],
  );

  return { setActive, isSaving: (id: string) => !!saving[id], hasError: (id: string) => !!failed[id] };
}
