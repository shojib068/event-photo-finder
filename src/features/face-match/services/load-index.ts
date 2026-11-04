import { isFaceIndex, type FaceIndex } from '../../../shared/face-index';

export class IndexLoadError extends Error {}

/** Downloads one event's index, reporting progress (0..1, or null when size is unknown). */
export async function loadFaceIndex(eventId: string, indexPath: string, onProgress: (share: number | null) => void, signal?: AbortSignal): Promise<FaceIndex> {
  const response = await fetch(indexPath, { signal, cache: 'no-cache' });
  if (!response.ok || !response.body) throw new IndexLoadError(`Index request failed (${response.status})`);
  const total = Number(response.headers.get('content-length')) || 0;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(total > 0 ? Math.min(1, received / total) : null);
  }
  const parsed: unknown = JSON.parse(await new Blob(chunks as BlobPart[]).text());
  if (!isFaceIndex(parsed, eventId)) throw new IndexLoadError('Index file is invalid or belongs to another event');
  return parsed;
}
