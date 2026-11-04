import sharp from 'sharp';
import { getConfig } from '@/core/config';
import { findEventBySlug } from '@/shared/events';
import { getFaceProvider } from '@/shared/face-provider';
import type { MatchResult } from '../types';
import { matchSelfieWith } from './match';
import { createGallery, searchFaces } from './repository';

export { checkSelfieQuality } from './selfie-quality';

/** Production wiring of the matcher. Selfie stays in memory. */
export function matchSelfie(slug: string, selfie: Buffer): Promise<MatchResult> {
  return matchSelfieWith(
    {
      findEventBySlug,
      detectAndEmbed: (image) => getFaceProvider().detectAndEmbed(image),
      imageWidth: async (image) => (await sharp(image).metadata()).width ?? 0,
      searchFaces,
      createGallery,
      threshold: getConfig().MATCH_THRESHOLD,
    },
    slug,
    selfie,
  );
}
