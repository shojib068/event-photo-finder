'use client';

import { useCallback, useState } from 'react';
import { apiJson, errorCode } from '@/shared/api-client';
import type { AdminErrorCode } from '@/shared/content';
import type { AddEventResponse } from '../types';

const KNOWN: AdminErrorCode[] = ['INVALID_LINK', 'NOT_A_FOLDER', 'FOLDER_NOT_SHARED', 'ALREADY_ADDED', 'DRIVE_NOT_CONFIGURED'];

/** Adds a Drive folder link. `error` is an AdminErrorCode to look up in messages.admin. */
export function useAddDriveLink(secret: string, onAdded?: () => void) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AdminErrorCode | null>(null);

  const add = useCallback(
    async (driveLink: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await apiJson<AddEventResponse>(`/api/admin/${secret}/events`, 'POST', { driveLink });
        onAdded?.();
        return true;
      } catch (err) {
        const code = errorCode(err) as AdminErrorCode;
        setError(KNOWN.includes(code) ? code : 'UNKNOWN');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [secret, onAdded],
  );

  return { add, submitting, error, clearError: () => setError(null) };
}
