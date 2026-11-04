import { handleAddEvent } from '@/features/drive-connect';
import { handleListEvents } from '@/features/photo-indexing';

type Ctx = { params: Promise<{ secret: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return handleListEvents((await params).secret);
}

export async function POST(req: Request, { params }: Ctx) {
  return handleAddEvent(req, (await params).secret);
}
