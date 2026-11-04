import { SelfieScreen } from '@/features/selfie-capture';

export default async function SelfiePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SelfieScreen slug={slug} />;
}
