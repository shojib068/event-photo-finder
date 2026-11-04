import { toBase64Url } from '../../../shared/photo-ref';
import { pemToDer } from './pem';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const encoder = new TextEncoder();

interface CachedToken {
  key: string;
  token: string;
  expiresAt: number;
}
let cached: CachedToken | null = null;

const b64json = (value: object) => toBase64Url(encoder.encode(JSON.stringify(value)));

async function signJwt(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64json({ alg: 'RS256', typ: 'JWT' })}.${b64json({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(privateKeyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned));
  return `${unsigned}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Read-only Drive access token for the service account, cached until shortly before expiry. */
export async function getDriveAccessToken(serviceAccountJson: string): Promise<string> {
  const account = JSON.parse(serviceAccountJson) as { client_email?: string; private_key?: string };
  if (!account.client_email || !account.private_key) throw new Error('Invalid service account JSON');
  if (cached && cached.key === account.client_email && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: await signJwt(account.client_email, account.private_key) }),
  });
  if (!response.ok) throw new Error(`Token request failed (${response.status})`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cached = { key: account.client_email, token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}
