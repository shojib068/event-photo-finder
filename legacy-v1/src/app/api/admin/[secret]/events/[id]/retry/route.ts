import { handleRetryEvent } from '@/features/photo-indexing';

type Ctx = { params: Promise<{ secret: string; id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { secret, id } = await params;
  return handleRetryEvent(secret, id);
}
