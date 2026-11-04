'use client';

import { createContext, useContext } from 'react';

export type SelfieRetakeCode = 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY';

/**
 * Bridge between the selfie screen (selfie-capture) and the matcher state (face-match),
 * which cannot import each other. The selfie Blob passes through memory only.
 */
export interface SelfieHandoff {
  /** Hands the in-memory selfie to the matcher. */
  submit(selfie: Blob): void;
  /** Set when the last selfie failed the server quality check and must be retaken. */
  retakeReason: SelfieRetakeCode | null;
  /** Clears the last result before a new attempt. */
  clear(): void;
}

const SelfieHandoffContext = createContext<SelfieHandoff | null>(null);

export const SelfieHandoffProvider = SelfieHandoffContext.Provider;

export function useSelfieHandoff(): SelfieHandoff {
  const ctx = useContext(SelfieHandoffContext);
  if (!ctx) throw new Error('useSelfieHandoff must be used inside the guest flow (MatchProvider)');
  return ctx;
}
