import { isValidEventId } from '../../../shared/events';
import { openPhotoRef } from '../../../shared/photo-ref';
import { getDriveAccessToken } from '../services/google-token';
import { ALLOWED_MIME_TYPES, DriveError, fetchOriginal, fetchThumbnail, getFileInfo } from '../services/drive-photo';
import type { PhotoProxyEnv } from '../types';

const ONE_DAY = 86_400;

function plain(status: number, message: string): Response {
  return new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.\- ()]+/g, '_').slice(0, 120) || 'photo';
}

function imageResponse(source: Response, mimeType: string, fileName: string, download: boolean): Response {
  const headers = new Headers({
    'content-type': mimeType,
    'cache-control': `private, max-age=${ONE_DAY}`,
    'x-content-type-options': 'nosniff',
    'content-disposition': `${download ? 'attachment' : 'inline'}; filename="${safeFileName(fileName)}"`,
  });
  const length = source.headers.get('content-length');
  if (length) headers.set('content-length', length);
  return new Response(source.body, { status: 200, headers });
}

/**
 * GET /api/photo/:eventId/:ref?size=thumb|full[&download=1]
 * Decrypts the event-bound ref, then streams the photo from the private Drive folder using the
 * service account. The browser never sees Drive IDs, links or credentials.
 */
export async function handlePhotoRequest(request: Request, params: { eventId: string; ref: string }, env: Partial<PhotoProxyEnv>): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return plain(405, 'Method not allowed');
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON || !env.PHOTO_REF_SECRET) return plain(503, 'Photo access is not configured');
  if (!isValidEventId(params.eventId)) return plain(404, 'Not found');
  const fileId = await openPhotoRef(env.PHOTO_REF_SECRET, params.eventId, params.ref);
  if (!fileId) return plain(404, 'Not found');

  const url = new URL(request.url);
  const wantsThumb = url.searchParams.get('size') !== 'full';
  const download = url.searchParams.get('download') === '1';
  try {
    const token = await getDriveAccessToken(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const info = await getFileInfo(fileId, token);
    if (!ALLOWED_MIME_TYPES.has(info.mimeType)) return plain(415, 'Unsupported file type');
    const thumb = wantsThumb ? await fetchThumbnail(info, token) : null;
    if (thumb) return imageResponse(thumb, thumb.headers.get('content-type') ?? 'image/jpeg', info.name, download);
    return imageResponse(await fetchOriginal(fileId, token), info.mimeType, info.name, download);
  } catch (error) {
    if (error instanceof DriveError && (error.status === 404 || error.status === 403)) return plain(404, 'Photo unavailable');
    return plain(502, 'Photo temporarily unavailable');
  }
}
