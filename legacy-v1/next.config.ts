import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(self)' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Request paths contain gallery tokens and the admin secret: never log them.
  logging: { incomingRequests: false },
  serverExternalPackages: ['pg', 'sharp', 'googleapis', 'pino', 'archiver', 'qrcode'],
  // Lets the HTTPS tunnel host load dev assets when running `next dev`.
  allowedDevOrigins: ['*.trycloudflare.com', '*.ngrok-free.app', '*.ngrok-free.dev', '*.ngrok.app', '*.ngrok.dev'],
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/(e|g|api/e|api/g)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },
};

export default nextConfig;
