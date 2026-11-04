import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { messages } from '@/shared/content';
import './globals.css';

export const metadata: Metadata = {
  title: messages.appName,
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf8f4',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Browser extensions add attributes to <html>/<body> (e.g. __gcrremoteframetoken,
    // ColorZilla's cz-shortcut-listen) before hydration. Only affects these two tags, not children.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
