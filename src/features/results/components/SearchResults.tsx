import { useState } from 'react';
import { appConfig } from '../../../core/config';
import { messages } from '../../../shared/content';
import type { PhotoMatch } from '../../../shared/face-index';
import { Button } from '../../../shared/ui';
import { usePaged } from '../hooks/usePaged';
import { PhotoTile } from './PhotoTile';
import { PhotoViewer } from './PhotoViewer';

const t = messages.results;

/** Results page: responsive grid sorted by similarity, viewer, downloads and search again. */
export function SearchResults({ eventId, matches, onSearchAgain }: { eventId: string; matches: PhotoMatch[]; onSearchAgain: () => void }) {
  const { visible, hasMore, showMore } = usePaged(matches, appConfig.resultsPageSize);
  const [open, setOpen] = useState<number | null>(null);

  if (matches.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold">{t.none}</h1>
        <p className="text-stone-600">{t.noneHelp}</p>
        <Button onClick={onSearchAgain}>{t.searchAgain}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.found(matches.length)}</h1>
          <p className="text-sm text-stone-500">{t.hint}</p>
        </div>
        <Button variant="secondary" onClick={onSearchAgain}>{t.searchAgain}</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((match, i) => (
          <PhotoTile key={match.photo.id} eventId={eventId} match={match} onOpen={() => setOpen(i)} />
        ))}
      </div>
      {hasMore && (
        <div className="text-center">
          <Button variant="secondary" onClick={showMore}>{t.showMore}</Button>
        </div>
      )}
      {open !== null && <PhotoViewer eventId={eventId} matches={matches} position={open} onMove={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
