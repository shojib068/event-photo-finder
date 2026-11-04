import { describe, expect, it } from 'vitest';
import type { EventRecord } from '@/shared/events';
import { fakeEmbedding, FakeFaceProvider, type DetectedFace } from '@/shared/face-provider';
import { matchSelfieWith, type MatchDeps } from '../services/match';
import { checkSelfieQuality } from '../services/selfie-quality';
import type { PhotoMatch } from '../types';

/** In-memory face index with the same semantics as the SQL: filter by event, best score per photo, threshold. */
interface IndexedFace { eventId: string; photoId: string; embedding: Float32Array }

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}

function memorySearch(index: IndexedFace[]) {
  return async (eventId: string, embedding: Float32Array, threshold: number): Promise<PhotoMatch[]> => {
    const best = new Map<string, number>();
    for (const f of index) {
      if (f.eventId !== eventId) continue;
      const score = cosine(f.embedding, embedding);
      if (score >= threshold) best.set(f.photoId, Math.max(best.get(f.photoId) ?? -1, score));
    }
    return [...best].map(([photoId, score]) => ({ photoId, score })).sort((a, b) => b.score - a.score);
  };
}

const selfieFace = (embedding: Float32Array, overrides: Partial<DetectedFace> = {}): DetectedFace => ({
  embedding, bbox: [100, 100, 300, 300], detScore: 0.95, ...overrides,
});

function event(id: string, slug: string, overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id, slug, driveFolderId: `drive-${id}`, folderName: id, status: 'ready', active: true,
    photosTotal: 3, photosDone: 3, error: null, createdAt: new Date(), ...overrides,
  };
}

// Guest "alice" appears in event A (photos a1, a2) and in event B (photo b1).
const alice = fakeEmbedding(0);
const aliceSlightlyTurned = fakeEmbedding(0, 0.5); // cos(0.5) ~ 0.88
const bob = fakeEmbedding(10);
const INDEX: IndexedFace[] = [
  { eventId: 'A', photoId: 'a1', embedding: alice },
  { eventId: 'A', photoId: 'a1', embedding: bob },
  { eventId: 'A', photoId: 'a2', embedding: aliceSlightlyTurned },
  { eventId: 'A', photoId: 'a3', embedding: bob },
  { eventId: 'B', photoId: 'b1', embedding: alice },
];

function makeDeps(events: EventRecord[], selfieFaces: Record<string, DetectedFace[]>) {
  const provider = new FakeFaceProvider(selfieFaces);
  const galleries = new Map<string, { eventId: string; matches: PhotoMatch[] }>();
  const deps: MatchDeps = {
    findEventBySlug: async (slug) => events.find((e) => e.slug === slug) ?? null,
    detectAndEmbed: (img) => provider.detectAndEmbed(img),
    imageWidth: async () => 720,
    searchFaces: memorySearch(INDEX),
    createGallery: async (eventId, matches) => {
      const token = `token-${galleries.size}`;
      galleries.set(token, { eventId, matches });
      return token;
    },
    threshold: 0.45,
  };
  return { deps, galleries };
}

const events = [event('A', 'slugA'), event('B', 'slugB')];
const SELFIE = Buffer.from('alice-selfie');

describe('matchSelfieWith: matching scope', () => {
  it('returns only photos of the scanned link', async () => {
    const { deps, galleries } = makeDeps(events, { 'alice-selfie': [selfieFace(alice)] });
    const result = await matchSelfieWith(deps, 'slugA', SELFIE);
    expect(result).toMatchObject({ match: true });
    const gallery = galleries.get((result as { token: string }).token)!;
    expect(gallery.eventId).toBe('A');
    expect(gallery.matches.map((m) => m.photoId)).toEqual(['a1', 'a2']);
  });

  it('never returns photos from another event', async () => {
    const { deps, galleries } = makeDeps(events, { 'alice-selfie': [selfieFace(alice)] });
    const result = await matchSelfieWith(deps, 'slugB', SELFIE);
    const ids = galleries.get((result as { token: string }).token)!.matches.map((m) => m.photoId);
    expect(ids).toEqual(['b1']);
  });

  it('dedupes per photo and orders by score', async () => {
    const { deps, galleries } = makeDeps(events, { 'alice-selfie': [selfieFace(alice)] });
    const result = await matchSelfieWith(deps, 'slugA', SELFIE);
    const matches = galleries.get((result as { token: string }).token)!.matches;
    expect(new Set(matches.map((m) => m.photoId)).size).toBe(matches.length);
    expect(matches[0]!.score).toBeGreaterThanOrEqual(matches[1]!.score);
  });

  it('applies the fixed threshold', async () => {
    const { deps, galleries } = makeDeps(events, { 'alice-selfie': [selfieFace(alice)] });
    const strict = await matchSelfieWith({ ...deps, threshold: 0.99 }, 'slugA', SELFIE);
    // At 0.99 only the exact face (a1) qualifies, not the turned one (a2, ~0.88).
    const ids = galleries.get((strict as { token: string }).token)!.matches.map((m) => m.photoId);
    expect(ids).toEqual(['a1']);
  });

  it('returns no match and creates no gallery for a stranger', async () => {
    const { deps, galleries } = makeDeps(events, { 'alice-selfie': [selfieFace(fakeEmbedding(200))] });
    expect(await matchSelfieWith(deps, 'slugA', SELFIE)).toEqual({ match: false });
    expect(galleries.size).toBe(0);
  });
});

describe('matchSelfieWith: Active / Ready rules', () => {
  it.each([
    ['pending', true], ['indexing', true], ['failed', true], ['ready', false],
  ] as const)('rejects when status=%s active=%s', async (status, active) => {
    const { deps } = makeDeps([event('A', 'slugA', { status, active })], { 'alice-selfie': [selfieFace(alice)] });
    expect(await matchSelfieWith(deps, 'slugA', SELFIE)).toEqual({ error: 'NOT_AVAILABLE' });
  });

  it('rejects an unknown slug', async () => {
    const { deps } = makeDeps(events, { 'alice-selfie': [selfieFace(alice)] });
    expect(await matchSelfieWith(deps, 'nope', SELFIE)).toEqual({ error: 'NOT_AVAILABLE' });
  });
});

describe('checkSelfieQuality', () => {
  it('NO_FACE when nothing detected', () => {
    expect(checkSelfieQuality([], 720)).toEqual({ ok: false, code: 'NO_FACE' });
  });
  it('MULTIPLE_FACES when two confident faces', () => {
    expect(checkSelfieQuality([selfieFace(alice), selfieFace(bob)], 720)).toEqual({ ok: false, code: 'MULTIPLE_FACES' });
  });
  it('ignores weak background detections', () => {
    expect(checkSelfieQuality([selfieFace(alice), selfieFace(bob, { detScore: 0.3 })], 720).ok).toBe(true);
  });
  it('LOW_QUALITY when the face is small', () => {
    expect(checkSelfieQuality([selfieFace(alice, { bbox: [0, 0, 50, 50] })], 720)).toEqual({ ok: false, code: 'LOW_QUALITY' });
  });
  it('LOW_QUALITY when detection is weak', () => {
    expect(checkSelfieQuality([selfieFace(alice, { detScore: 0.65 })], 720)).toEqual({ ok: false, code: 'LOW_QUALITY' });
  });
});
