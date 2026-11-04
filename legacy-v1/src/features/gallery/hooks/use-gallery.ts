'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from '@/shared/api-client';
import type { GalleryPhoto, GalleryResponse, PhotoSize } from '../types';

export type GalleryState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; photos: GalleryPhoto[] };

/** App-only photo URLs (never Drive URLs). */
export function galleryUrls(token: string) {
  return {
    photo: (photoId: string, size: PhotoSize, download = false) =>
      `/api/g/${token}/photos/${photoId}?size=${size}&download=${download ? 1 : 0}`,
    zip: () => `/api/g/${token}/zip`,
  };
}

/** Loads a private gallery by token. Independent of the selfie flow (bookmarks work). */
export function useGallery(token: string) {
  const [state, setState] = useState<GalleryState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await apiFetch<GalleryResponse>(`/api/g/${token}`);
      setState({ status: 'ready', photos: res.photos });
    } catch (err) {
      setState({ status: err instanceof ApiError && err.status === 404 ? 'not-found' : 'error' });
    }
  }, [token]);

  useEffect(() => {
    // Fetch on mount; state is updated after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { state, reload: load, urls: galleryUrls(token) };
}
