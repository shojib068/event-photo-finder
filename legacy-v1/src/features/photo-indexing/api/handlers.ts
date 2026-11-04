import { NextResponse } from 'next/server';
import { getServiceAccountEmail } from '@/core/storage';
import { getConfig } from '@/core/config';
import { getLogger } from '@/core/logger';
import { isAdminSecret } from '@/shared/admin-secret';
import { jsonError, notFound, PRIVATE_NO_STORE } from '@/shared/http';
import { listEventStatuses } from '../services/status';
import { requeueFailed } from '../services/repository';
import type { AdminEventsResponse } from '../types';

/** GET /api/admin/:secret/events */
export async function handleListEvents(secret: string): Promise<NextResponse> {
  if (!isAdminSecret(secret)) return notFound();
  const base = getConfig().PUBLIC_BASE_URL;
  const rows = await listEventStatuses();
  const body: AdminEventsResponse = {
    serviceAccountEmail: getServiceAccountEmail(),
    events: rows.map(({ summary, slug }) =>
      summary.status === 'ready'
        ? { ...summary, qrUrl: `/api/admin/${secret}/events/${summary.id}/qr?format=png`, guestUrl: `${base}/e/${slug}` }
        : summary,
    ),
  };
  return NextResponse.json(body, { headers: PRIVATE_NO_STORE });
}

/** POST /api/admin/:secret/events/:id/retry — re-queues a failed link. */
export async function handleRetryEvent(secret: string, id: string): Promise<NextResponse> {
  if (!isAdminSecret(secret)) return notFound();
  const event = await requeueFailed(id).catch(() => null);
  if (!event) return jsonError(409, 'NOT_FAILED');
  getLogger().info({ eventId: id }, 'indexing retry requested');
  return NextResponse.json({ id, status: event.status });
}
