import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getLogger } from '@/core/logger';
import { isAdminSecret } from '@/shared/admin-secret';
import { findEventById, setEventActive } from '@/shared/events';
import { jsonError, notFound } from '@/shared/http';
import { buildEventUrl, renderQr } from '../services/qr';
import { setActiveWith } from '../services/set-active';
import type { SetActiveResponse } from '../types';

const UUID = z.string().uuid();
const patchSchema = z.object({ active: z.boolean() });

/** PATCH /api/admin/:secret/events/:id  { active } */
export async function handleSetActive(request: Request, secret: string, id: string): Promise<NextResponse> {
  if (!isAdminSecret(secret) || !UUID.safeParse(id).success) return notFound();
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, 'INVALID_INPUT');

  const result = await setActiveWith({ findEventById, setEventActive }, id, parsed.data.active);
  if (!result.ok) return result.code === 'NOT_READY' ? jsonError(409, 'NOT_READY') : notFound();

  getLogger().info({ eventId: id }, parsed.data.active ? 'link activated' : 'link deactivated');
  const body: SetActiveResponse = { id, active: result.event.active };
  return NextResponse.json(body);
}

/** GET /api/admin/:secret/events/:id/qr?format=png|svg */
export async function handleGetQr(request: Request, secret: string, id: string): Promise<Response> {
  if (!isAdminSecret(secret) || !UUID.safeParse(id).success) return notFound();
  const event = await findEventById(id);
  if (!event) return notFound();
  if (event.status !== 'ready') return jsonError(409, 'NOT_READY');

  const format = new URL(request.url).searchParams.get('format') === 'svg' ? 'svg' : 'png';
  const qr = await renderQr(buildEventUrl(event.slug), format);
  const safeName = event.folderName.replace(/[^\w\- ]+/g, '').trim() || 'event';
  return new Response(typeof qr === 'string' ? qr : new Uint8Array(qr), {
    headers: {
      'Content-Type': format === 'svg' ? 'image/svg+xml' : 'image/png',
      'Content-Disposition': `inline; filename="qr-${safeName}.${format}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
