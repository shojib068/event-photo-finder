'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { chunk, fileNameFromDisposition, mapLimit } from './photo-files';

const BATCH_SIZE = 20;
const CONCURRENCY = 3;

export type SaveState =
  | { status: 'idle'; batch: number }
  | { status: 'preparing'; batch: number; done: number; total: number }
  | { status: 'ready'; batch: number; count: number }
  | { status: 'finished' }
  | { status: 'unsupported'; batch: number }
  | { status: 'error'; batch: number };

/**
 * True on touch phones/tablets that can share image files ("Save Images" to Photos).
 * Desktop browsers can share files too, but a ZIP download suits them better.
 */
function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  if (!window.matchMedia('(pointer: coarse)').matches) return false;
  try {
    return navigator.canShare({ files: [new File([], 'photo.jpg', { type: 'image/jpeg' })] });
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

async function fetchPhotoFile(url: string, fallbackName: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('photo failed');
  const blob = await res.blob();
  const name = fileNameFromDisposition(res.headers.get('Content-Disposition'), fallbackName);
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

/**
 * Saves gallery photos through the native share sheet, in batches.
 * Two taps per batch: `prepare()` downloads the files, then `save()` opens the sheet
 * (the share call must come straight from a tap; iOS drops the tap while files download).
 * Files are held in memory for the current batch only.
 */
export function useSaveToPhotos(photoIds: readonly string[], fullUrl: (id: string) => string) {
  const supported = useSyncExternalStore(noopSubscribe, canShareFiles, () => false);
  const batches = useMemo(() => chunk(photoIds, BATCH_SIZE), [photoIds]);
  const [state, setState] = useState<SaveState>({ status: 'idle', batch: 0 });
  const files = useRef<File[]>([]);

  const prepare = useCallback(async (batch: number) => {
    const ids = batches[batch] ?? [];
    let done = 0;
    setState({ status: 'preparing', batch, done, total: ids.length });
    try {
      files.current = await mapLimit(ids, CONCURRENCY, async (id, i) => {
        const file = await fetchPhotoFile(fullUrl(id), `photo-${batch * BATCH_SIZE + i + 1}.jpg`);
        setState({ status: 'preparing', batch, done: ++done, total: ids.length });
        return file;
      });
      const ok = navigator.canShare({ files: files.current });
      setState(ok ? { status: 'ready', batch, count: ids.length } : { status: 'unsupported', batch });
    } catch {
      files.current = [];
      setState({ status: 'error', batch });
    }
  }, [batches, fullUrl]);

  const save = useCallback(async (batch: number) => {
    try {
      await navigator.share({ files: files.current });
    } catch (err) {
      // Closing the sheet is not an error: stay on this batch so the guest can try again.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      files.current = [];
      setState({ status: 'error', batch });
      return;
    }
    files.current = [];
    const next = batch + 1;
    setState(next < batches.length ? { status: 'idle', batch: next } : { status: 'finished' });
  }, [batches.length]);

  return { supported, state, batchCount: batches.length, prepare, save };
}
