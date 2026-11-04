import { fromBase64Url, toBase64Url } from './base64url';

/**
 * A photo reference is the Drive file ID encrypted (AES-256-GCM) together with its event ID.
 * Public index files only contain these refs, so Drive IDs are never exposed, and a ref from
 * one event cannot be used to read photos through another event's URL.
 * Works with WebCrypto in browsers, Node and Cloudflare Workers.
 */
const IV_BYTES = 12;
const REF_PATTERN = /^[A-Za-z0-9_-]{40,400}$/;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) throw new Error('PHOTO_REF_SECRET must be at least 32 characters');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`photo-ref:v1:${secret}`));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function createPhotoRef(secret: string, eventId: string, fileId: string): Promise<string> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(`${eventId}\n${fileId}`));
  const out = new Uint8Array(IV_BYTES + cipher.byteLength);
  out.set(iv);
  out.set(new Uint8Array(cipher), IV_BYTES);
  return toBase64Url(out);
}

/** Returns the Drive file ID, or null if the ref is malformed, tampered or for another event. */
export async function openPhotoRef(secret: string, eventId: string, ref: string): Promise<string | null> {
  if (!REF_PATTERN.test(ref)) return null;
  try {
    const bytes = fromBase64Url(ref);
    const key = await deriveKey(secret);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES) }, key, bytes.slice(IV_BYTES));
    const [refEvent, fileId] = decoder.decode(plain).split('\n');
    return refEvent === eventId && fileId ? fileId : null;
  } catch {
    return null;
  }
}
