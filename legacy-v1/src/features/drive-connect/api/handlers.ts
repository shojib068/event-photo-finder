import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getLogger } from '@/core/logger';
import { isAdminSecret } from '@/shared/admin-secret';
import { jsonError, notFound } from '@/shared/http';
import { ADD_FOLDER_HTTP_STATUS } from '../constants';
import { addDriveFolder } from '../services';
import type { AddEventResponse } from '../types';

const bodySchema = z.object({ driveLink: z.string().min(1).max(2000) });

/** POST /api/admin/:secret/events */
export async function handleAddEvent(request: Request, secret: string): Promise<NextResponse> {
  if (!isAdminSecret(secret)) return notFound();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, 'INVALID_LINK');

  const result = await addDriveFolder(parsed.data.driveLink);
  if (!result.ok) return jsonError(ADD_FOLDER_HTTP_STATUS[result.code], result.code);

  getLogger().info({ eventId: result.event.id }, 'link added');
  const body: AddEventResponse = { id: result.event.id, status: 'pending', active: false };
  return NextResponse.json(body, { status: 201 });
}
