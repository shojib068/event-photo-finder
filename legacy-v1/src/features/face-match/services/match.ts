import { isEventAvailable, type EventRecord } from '@/shared/events';
import type { DetectedFace } from '@/shared/face-provider';
import type { MatchResult, PhotoMatch } from '../types';
import { checkSelfieQuality } from './selfie-quality';

export interface MatchDeps {
  findEventBySlug(slug: string): Promise<EventRecord | null>;
  detectAndEmbed(image: Buffer): Promise<DetectedFace[]>;
  imageWidth(image: Buffer): Promise<number>;
  /** Must search ONLY faces of `eventId`. */
  searchFaces(eventId: string, embedding: Float32Array, threshold: number): Promise<PhotoMatch[]>;
  createGallery(eventId: string, matches: PhotoMatch[]): Promise<string>;
  threshold: number;
}

/**
 * Matches a selfie against the photos of the scanned link only.
 * The selfie buffer and its embedding stay in this call's scope; nothing is stored.
 */
export async function matchSelfieWith(deps: MatchDeps, slug: string, selfie: Buffer): Promise<MatchResult> {
  const event = await deps.findEventBySlug(slug);
  if (!event || !isEventAvailable(event)) return { error: 'NOT_AVAILABLE' };

  const [faces, width] = await Promise.all([deps.detectAndEmbed(selfie), deps.imageWidth(selfie)]);
  const quality = checkSelfieQuality(faces, width);
  if (!quality.ok) return { error: quality.code };

  const matches = await deps.searchFaces(event.id, quality.face.embedding, deps.threshold);
  if (matches.length === 0) return { match: false };

  const token = await deps.createGallery(event.id, matches);
  return { match: true, token };
}
