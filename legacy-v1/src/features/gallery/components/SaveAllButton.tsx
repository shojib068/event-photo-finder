'use client';

import { messages } from '@/shared/content';
import type { SaveState } from '../hooks/use-save-to-photos';

interface Props {
  state: SaveState;
  batchCount: number;
  onPrepare: (batch: number) => void;
  onSave: (batch: number) => void;
}

/** Phone "Save all to Photos": prepare a batch, then tap again to open the share sheet. */
export function SaveAllButton({ state, batchCount, onPrepare, onSave }: Props) {
  const g = messages.guest;
  switch (state.status) {
    case 'preparing':
      return (
        <button type="button" className="btn btn--primary" disabled>
          {g.preparingPhotos(state.done, state.total)}
        </button>
      );
    case 'ready':
      return (
        <button type="button" className="btn btn--primary" onClick={() => onSave(state.batch)}>
          {g.savePhotosReady(state.count, state.batch + 1, batchCount)}
        </button>
      );
    case 'finished':
      return (
        <button type="button" className="btn btn--primary" onClick={() => onPrepare(0)}>
          {g.saveAgain}
        </button>
      );
    default: {
      const label = state.batch === 0 ? g.saveAllToPhotos : g.saveNextBatch(state.batch + 1, batchCount);
      return (
        <button type="button" className="btn btn--primary" onClick={() => onPrepare(state.batch)}>
          {label}
        </button>
      );
    }
  }
}
