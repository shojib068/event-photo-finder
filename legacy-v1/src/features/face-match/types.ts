export type SelfieQualityCode = 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY';

export type MatchResult =
  | { match: true; token: string }
  | { match: false }
  | { error: 'NOT_AVAILABLE' | SelfieQualityCode };

export interface PhotoMatch {
  photoId: string;
  score: number;
}

/** Response of GET /api/e/:slug. */
export interface AvailabilityResponse {
  available: boolean;
}

/** Response of POST /api/e/:slug/match. */
export type MatchResponse = { match: true; token: string } | { match: false };

/** Client-side state of the current search (in memory only). */
export type MatchState =
  | { phase: 'idle' }
  | { phase: 'pending' }
  | { phase: 'match'; token: string }
  | { phase: 'no-match' }
  | { phase: 'error'; code: MatchErrorCode };

export type MatchErrorCode =
  | SelfieQualityCode
  | 'NOT_AVAILABLE'
  | 'FACE_SERVICE_DOWN'
  | 'TOO_MANY_REQUESTS'
  | 'TIMEOUT'
  | 'UNKNOWN';
