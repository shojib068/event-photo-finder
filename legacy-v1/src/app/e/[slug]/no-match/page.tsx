import { NoMatchScreen } from '@/features/face-match';

export default async function NoMatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NoMatchScreen slug={slug} />;
}
