import { handleGetGallery } from '@/features/gallery';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return handleGetGallery((await params).token);
}
