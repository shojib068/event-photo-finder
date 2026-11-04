import { handleGetAvailability } from '@/features/face-match';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return handleGetAvailability((await params).slug);
}
