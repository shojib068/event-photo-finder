import { describe, expect, it, vi } from 'vitest';
import { fakeEmbedding, type DetectedFace } from '@/shared/face-provider';
import type { EventRecord } from '@/shared/events';
import { filterIndexableFaces } from '../services/face-filter';
import { indexEvent, type IndexDeps } from '../services/index-event';

const face = (detScore: number, size: number): DetectedFace => ({ embedding: fakeEmbedding(0), bbox: [0, 0, size, size], detScore });

const event = { id: 'ev1', driveFolderId: 'folder' } as EventRecord;

function makeDeps(overrides: Partial<IndexDeps> = {}): IndexDeps & { saved: Map<string, DetectedFace[]>; marked: Map<string, string> } {
  const saved = new Map<string, DetectedFace[]>();
  const marked = new Map<string, string>();
  return {
    saved,
    marked,
    listImages: async () => [],
    download: async (id) => Buffer.from(id),
    detectAndEmbed: async () => [face(0.9, 100)],
    upsertPhotos: async () => undefined,
    listPendingPhotos: async () => [
      { id: 'p1', driveFileId: 'd1', mimeType: 'image/jpeg', attempts: 0 },
      { id: 'p2', driveFileId: 'd2', mimeType: 'image/x-canon-cr2', attempts: 0 },
    ],
    saveFaces: async (_e, photoId, faces) => void saved.set(photoId, faces),
    markPhoto: async (_e, photoId, status) => void marked.set(photoId, status),
    finishEvent: vi.fn(async () => undefined),
    onPhotoError: () => undefined,
    sleep: async () => undefined,
    concurrency: 2,
    ...overrides,
  };
}

describe('filterIndexableFaces', () => {
  it('drops low-confidence and tiny faces', () => {
    const kept = filterIndexableFaces([face(0.9, 100), face(0.5, 100), face(0.9, 30)]);
    expect(kept).toHaveLength(1);
  });
});

describe('indexEvent', () => {
  it('indexes supported photos, skips unsupported ones, then finishes', async () => {
    const deps = makeDeps();
    await indexEvent(deps, event);
    expect(deps.saved.get('p1')).toHaveLength(1);
    expect(deps.marked.get('p2')).toBe('skipped');
    expect(deps.finishEvent).toHaveBeenCalledWith('ev1');
  });

  it('retries 3 times then marks the photo failed', async () => {
    const download = vi.fn(async () => Promise.reject(new Error('drive down')));
    const deps = makeDeps({ download });
    await indexEvent(deps, event);
    expect(download).toHaveBeenCalledTimes(3);
    expect(deps.marked.get('p1')).toBe('failed');
  });
});
