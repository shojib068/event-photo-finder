import { useState } from 'react';
import { messages } from '../../../shared/content';
import type { PhotoMatch } from '../../../shared/face-index';
import { photoUrl } from '../../../shared/photo-ref';

const t = messages.results;

export function PhotoTile({ eventId, match, onOpen }: { eventId: string; match: PhotoMatch; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const { photo } = match;
  const ratio = photo.width && photo.height ? `${photo.width} / ${photo.height}` : '3 / 4';
  return (
    <figure className="overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
      <button type="button" onClick={onOpen} className="block w-full bg-stone-100" style={{ aspectRatio: ratio }} aria-label={photo.name}>
        {failed ? (
          <span className="flex h-full items-center justify-center p-2 text-xs text-stone-500">{t.unavailable}</span>
        ) : (
          <img src={photoUrl(eventId, photo.ref, 'thumb')} alt={photo.name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
        )}
      </button>
      <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
        <span className="text-stone-500">{t.match(match.score)}</span>
        <a className="font-semibold text-rose-700 hover:underline" href={photoUrl(eventId, photo.ref, 'full', true)} download={photo.name}>
          {t.download}
        </a>
      </figcaption>
    </figure>
  );
}
