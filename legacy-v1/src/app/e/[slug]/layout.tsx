import type { ReactNode } from 'react';
import { AvailabilityGate, MatchProvider } from '@/features/face-match';

/** Guest flow: match state and the availability check live here and persist across steps. */
export default async function GuestFlowLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <MatchProvider slug={slug}>
      <AvailabilityGate slug={slug}>{children}</AvailabilityGate>
    </MatchProvider>
  );
}
