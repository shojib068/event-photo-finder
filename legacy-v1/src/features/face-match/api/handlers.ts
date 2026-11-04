import { NextResponse } from 'next/server';
import { getConfig } from '@/core/config';
import { getLogger } from '@/core/logger';
import { findEventBySlug, isEventAvailable } from '@/shared/events';
import { FaceServiceDownError } from '@/shared/face-provider';
import { clientIp, jsonError, PRIVATE_NO_STORE } from '@/shared/http';
import { isTokenShape } from '@/shared/tokens';
import { SELFIE_MIME } from '../constants';
import { createRateLimiter } from '../services/rate-limit';
import { matchSelfie } from '../services';
import type { AvailabilityResponse, MatchResponse } from '../types';

const allow = createRateLimiter();

/** GET /api/e/:slug — the same answer for unknown, not ready and switched off. */
export async function handleGetAvailability(slug: string): Promise<NextResponse> {
  const event = isTokenShape(slug) ? await findEventBySlug(slug) : null;
  const body: AvailabilityResponse = { available: isEventAvailable(event) };
  return NextResponse.json(body, { headers: PRIVATE_NO_STORE });
}

/** POST /api/e/:slug/match — multipart field `selfie`. The selfie is never stored or logged. */
export async function handleMatch(request: Request, slug: string): Promise<NextResponse> {
  if (!allow(clientIp(request.headers))) return jsonError(429, 'TOO_MANY_REQUESTS');
  if (!isTokenShape(slug)) return jsonError(403, 'NOT_AVAILABLE');

  const max = getConfig().MAX_SELFIE_BYTES;
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > max + 64 * 1024) return jsonError(413, 'TOO_LARGE');

  const form = await request.formData().catch(() => null);
  const file = form?.get('selfie');
  if (!(file instanceof Blob) || !SELFIE_MIME.has(file.type)) return jsonError(400, 'NO_FACE');
  if (file.size > max) return jsonError(413, 'TOO_LARGE');

  const log = getLogger();
  try {
    const result = await matchSelfie(slug, Buffer.from(await file.arrayBuffer()));
    if ('error' in result) {
      return result.error === 'NOT_AVAILABLE' ? jsonError(403, 'NOT_AVAILABLE') : jsonError(400, result.error);
    }
    log.info({ matched: result.match }, 'match finished');
    const body: MatchResponse = result.match ? { match: true, token: result.token } : { match: false };
    return NextResponse.json(body, { headers: PRIVATE_NO_STORE });
  } catch (err) {
    if (err instanceof FaceServiceDownError) {
      log.error('face-service unavailable');
      return jsonError(503, 'FACE_SERVICE_DOWN');
    }
    log.error({ err: err instanceof Error ? err.message : 'unknown' }, 'match failed');
    return jsonError(500, 'UNKNOWN');
  }
}
