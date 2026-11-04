import { handleGetZip } from '@/features/gallery';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return handleGetZip((await params).token);
}
