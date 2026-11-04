import { useEffect, useState } from 'react';
import { appConfig } from '../../../core/config';
import type { PhotoMatch } from '../../../shared/face-index';
import { loadFaceIndex } from '../services/load-index';
import { countFaces, matchIndex } from '../services/match-index';

export type SearchState =
  | { status: 'loading-index'; share: number | null }
  | { status: 'matching'; photoCount: number; facesChecked: number; totalFaces: number }
  | { status: 'done'; matches: PhotoMatch[]; photoCount: number }
  | { status: 'error' };

const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Runs one search. The selfie descriptor is copied for the duration of the search and the copy
 * is zeroed as soon as matching finishes or the screen unmounts. The caller drops its own copy
 * when the search ends.
 */
export function useFaceSearch(eventId: string, indexPath: string, descriptor: number[]): SearchState {
  const [state, setState] = useState<SearchState>({ status: 'loading-index', share: 0 });
  useEffect(() => {
    const controller = new AbortController();
    const selfie = Float32Array.from(descriptor);
    const wipe = () => selfie.fill(0);
    async function run() {
      const index = await loadFaceIndex(eventId, indexPath, (share) => setState({ status: 'loading-index', share }), controller.signal);
      const photoCount = index.photos.length;
      setState({ status: 'matching', photoCount, facesChecked: 0, totalFaces: countFaces(index) });
      const matches = await matchIndex(index, selfie, {
        threshold: appConfig.matchThreshold,
        batchSize: appConfig.matchBatchSize,
        signal: controller.signal,
        yieldToUi: nextFrame,
        onProgress: (p) => setState({ status: 'matching', photoCount, ...p }),
      });
      setState({ status: 'done', matches, photoCount });
    }
    run()
      .catch(() => !controller.signal.aborted && setState({ status: 'error' }))
      .finally(wipe);
    return () => {
      controller.abort();
      wipe();
    };
  }, [eventId, indexPath, descriptor]);

  return state;
}
