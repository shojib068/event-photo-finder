/**
 * Node-side configuration for developer tools (indexer, QR generator, local photo proxy).
 * The only place that reads process.env.
 */
import { readFileSync } from 'node:fs';

export interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env (see .env.example)`);
  return value;
}

export function getPhotoRefSecret(): string {
  const secret = required('PHOTO_REF_SECRET');
  if (secret.length < 32) throw new Error('PHOTO_REF_SECRET must be at least 32 characters');
  return secret;
}

export function getSiteUrl(): string {
  return required('SITE_URL');
}

export function getServiceAccountJson(): string {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) return inline;
  return readFileSync(required('GOOGLE_SERVICE_ACCOUNT_KEY_FILE'), 'utf8');
}

export function getServiceAccount(): ServiceAccount {
  const parsed = JSON.parse(getServiceAccountJson()) as Partial<ServiceAccount>;
  if (!parsed.client_email || !parsed.private_key) throw new Error('Service account JSON is missing client_email/private_key');
  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

/** Returns the env vars the photo proxy needs, or null if they are not configured. */
export function getPhotoProxyEnv(): { GOOGLE_SERVICE_ACCOUNT_JSON: string; PHOTO_REF_SECRET: string } | null {
  try {
    return { GOOGLE_SERVICE_ACCOUNT_JSON: getServiceAccountJson(), PHOTO_REF_SECRET: getPhotoRefSecret() };
  } catch {
    return null;
  }
}

/** Loads ./.env into process.env for tools that are not started through `tsx --env-file`. */
export function loadDotEnv(file = '.env'): void {
  try {
    process.loadEnvFile(file);
  } catch {
    // no .env file: fine, values may come from the real environment
  }
}
