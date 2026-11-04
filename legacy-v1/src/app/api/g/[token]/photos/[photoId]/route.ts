import { handleGetPhoto } from '@/features/gallery';

type Ctx = { params: Promise<{ token: string; photoId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { token, photoId } = await params;
  return handleGetPhoto(req, token, photoId);
}
