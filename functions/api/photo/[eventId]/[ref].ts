/**
 * Cloudflare Pages Function: GET /api/photo/:eventId/:ref
 * Thin adapter; all logic lives in src/features/photo-proxy.
 * Secrets (Pages > Settings > Environment variables): GOOGLE_SERVICE_ACCOUNT_JSON, PHOTO_REF_SECRET.
 */
import { handlePhotoRequest, type PhotoProxyEnv } from '../../../../src/features/photo-proxy';

interface PagesContext {
  request: Request;
  env: Partial<PhotoProxyEnv>;
  params: Record<string, string | string[]>;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

export const onRequest = (context: PagesContext): Promise<Response> =>
  handlePhotoRequest(context.request, { eventId: one(context.params.eventId), ref: one(context.params.ref) }, context.env);
