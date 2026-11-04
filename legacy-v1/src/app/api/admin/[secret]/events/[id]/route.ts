import { handleSetActive } from '@/features/qr-code';

type Ctx = { params: Promise<{ secret: string; id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { secret, id } = await params;
  return handleSetActive(req, secret, id);
}
