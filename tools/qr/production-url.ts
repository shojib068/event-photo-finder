const PRIVATE_HOST = [
  /^localhost$/i,
  /\.local$/i,
  /\.localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];
const TEMPORARY_HOST = [/\.trycloudflare\.com$/i, /\.ngrok(-free)?\.(app|io|dev)$/i, /\.loca\.lt$/i];

/** Validates the production base URL that gets printed into QR codes. */
export function checkProductionUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SITE_URL "${raw}" is not a valid URL`);
  }
  if (url.protocol !== 'https:') throw new Error('SITE_URL must use https://');
  if (PRIVATE_HOST.some((re) => re.test(url.hostname))) throw new Error('SITE_URL must not be localhost or a private IP address');
  if (TEMPORARY_HOST.some((re) => re.test(url.hostname))) throw new Error('SITE_URL must be the permanent production domain, not a temporary tunnel URL');
  if (url.search || url.hash) throw new Error('SITE_URL must not contain a query or fragment');
  return url.origin + url.pathname.replace(/\/+$/, '');
}

export function eventUrl(baseUrl: string, eventId: string): string {
  return `${baseUrl}/event/${eventId}`;
}
