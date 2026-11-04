import { notFound } from 'next/navigation';
import { AdminScreen, isAdminPath } from '@/features/drive-connect';
import { messages } from '@/shared/content';

export const dynamic = 'force-dynamic';
export const metadata = { title: messages.admin.title, robots: { index: false } };

export default async function AdminPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  if (!isAdminPath(secret)) notFound();
  return <AdminScreen secret={secret} />;
}
