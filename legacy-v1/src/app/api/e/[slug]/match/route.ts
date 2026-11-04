import { handleMatch } from '@/features/face-match';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: Ctx) {
  return handleMatch(req, (await params).slug);
}
