import { handleGetQr } from '@/features/qr-code';

type Ctx = { params: Promise<{ secret: string; id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { secret, id } = await params;
  return handleGetQr(req, secret, id);
}
