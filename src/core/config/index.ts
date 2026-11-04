/**
 * Browser configuration. The only place that reads import.meta.env.
 * Values are baked in at build time (Cloudflare Pages build environment variables).
 */
// Measured on real event photos: same person 0.52-0.99 (hard poses score low), different people up to ~0.78.
// 0.60 favours finding all of a guest's photos; results are sorted so look-alikes sort last.
const DEFAULT_MATCH_THRESHOLD = 0.6;

function parseThreshold(raw: string | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value < 1 ? value : DEFAULT_MATCH_THRESHOLD;
}

export const appConfig = {
  appName: 'Photo Finder',
  matchThreshold: parseThreshold(import.meta.env?.VITE_MATCH_THRESHOLD as string | undefined),
  /** Index faces compared per batch before yielding to the UI (progress + responsiveness). */
  matchBatchSize: 400,
  /** Results rendered per page in the grid (lazy "show more"). */
  resultsPageSize: 30,
} as const;
