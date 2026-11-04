import { useEffect } from 'react';
import { messages } from '../../../shared/content';
import type { PhotoMatch } from '../../../shared/face-index';
import { photoUrl } from '../../../shared/photo-ref';

const t = messages.results;

interface Props {
  eventId: string;
  matches: PhotoMatch[];
  position: number;
  onMove: (position: number) => void;
  onClose: () => void;
}

/** Full-screen viewer with previous/next, view-original and download. */
export function PhotoViewer({ eventId, matches, position, onMove, onClose }: Props) {
  const match = matches[position];
  const last = matches.length - 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && position > 0) onMove(position - 1);
      if (e.key === 'ArrowRight' && position < last) onMove(position + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [position, last, onMove, onClose]);

  if (!match) return null;
  const { photo } = match;
  return (
    <div role="dialog" aria-modal="true" aria-label={photo.name} className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between gap-2 p-3 text-sm">
        <span className="truncate">{position + 1} / {matches.length} · {t.match(match.score)}</span>
        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 font-semibold ring-1 ring-white/40">{t.close}</button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <img key={photo.id} src={photoUrl(eventId, photo.ref, 'thumb')} alt={photo.name} className="max-h-full max-w-full object-contain" />
        {position > 0 && <NavButton side="left" onClick={() => onMove(position - 1)} />}
        {position < last && <NavButton side="right" onClick={() => onMove(position + 1)} />}
      </div>
      <div className="flex justify-center gap-3 p-4">
        <a className="rounded-full px-5 py-3 font-semibold ring-1 ring-white/40" href={photoUrl(eventId, photo.ref, 'full')} target="_blank" rel="noreferrer">{t.view}</a>
        <a className="rounded-full bg-rose-600 px-5 py-3 font-semibold" href={photoUrl(eventId, photo.ref, 'full', true)} download={photo.name}>{t.download}</a>
      </div>
    </div>
  );
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={side === 'left' ? 'Previous' : 'Next'} className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-4 py-3 text-2xl ${side === 'left' ? 'left-2' : 'right-2'}`}>
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}
