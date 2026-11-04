'use client';

import { useCallback, useState } from 'react';

/** Native share sheet when available, else copies the link. `copied` turns true for 2.5 s. */
export function useShareLink() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (url: string, title: string) => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, title });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_500);
    } catch {
      setCopied(false);
    }
  }, []);

  return { share, copied };
}
