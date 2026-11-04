/** Selfie quality rules (technical spec 7.4). */
export const COUNTED_FACE_DET_SCORE = 0.6;
export const MIN_SELFIE_DET_SCORE = 0.7;
export const MIN_FACE_WIDTH_RATIO = 0.15;

/** Max photos returned per match. */
export const MATCH_LIMIT = 500;

/** Rate limit on POST /match: 10 / minute / IP. */
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Client gives up on a search after this long. */
export const MATCH_TIMEOUT_MS = 45_000;

export const SELFIE_MIME = new Set(['image/jpeg', 'image/png']);
