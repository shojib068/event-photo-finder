import { SearchingScreen } from '@/features/face-match';

export default async function SearchingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SearchingScreen slug={slug} />;
}
