import { WelcomeScreen } from '@/features/face-match';

export default async function WelcomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WelcomeScreen slug={slug} />;
}
