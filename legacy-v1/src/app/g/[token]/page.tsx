import type { Metadata } from 'next';
import { GalleryScreen } from '@/features/gallery';

export const metadata: Metadata = { robots: { index: false } };

export default async function GalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GalleryScreen token={token} />;
}
