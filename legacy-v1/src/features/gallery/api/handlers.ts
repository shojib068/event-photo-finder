import { NextResponse } from 'next/server';
import { getLogger } from '@/core/logger';
import { notFound } from '@/shared/http';
import { FULL_CACHE_CONTROL } from '../constants';
import { getGallery, streamPhoto, streamZip } from '../services/photo-stream';

const GALLERY_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' };

/** GET /api/g/:token */
export async function handleGetGallery(token: string): Promise<NextResponse> {
  const gallery = await getGallery(token);
  return gallery ? NextResponse.json(gallery, { headers: GALLERY_HEADERS }) : notFound();
}

/** GET /api/g/:token/photos/:photoId?size=thumb|full&download=0|1 */
export async function handleGetPhoto(request: Request, token: string, photoId: string): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const size = params.get('size') === 'full' ? 'full' : 'thumb';
  const download = params.get('download') === '1';
  try {
    const photo = await streamPhoto(token, photoId, size);
    if (!photo) return notFound();
    return new Response(photo.body, {
      headers: {
        'Content-Type': photo.contentType,
        'Cache-Control': FULL_CACHE_CONTROL,
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${photo.fileName}"`,
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    getLogger().error({ photoId, err: err instanceof Error ? err.message : 'unknown' }, 'photo stream failed');
    return NextResponse.json({ error: { code: 'UNAVAILABLE', message: 'Photo unavailable' } }, { status: 502 });
  }
}

/** GET /api/g/:token/zip */
export async function handleGetZip(token: string): Promise<Response> {
  const zip = await streamZip(token);
  if (!zip) return notFound();
  return new Response(zip, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="wedding-photos.zip"',
      ...GALLERY_HEADERS,
    },
  });
}
