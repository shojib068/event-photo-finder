import { z } from 'zod';

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().default('postgres://wedding:wedding@localhost:5432/wedding'),
  // Optional so the app can run before Drive is set up; Drive features then report NOT_CONFIGURED.
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE: z.preprocess(emptyToUndefined, z.string().optional()),
  FACE_PROVIDER: z.enum(['insightface']).default('insightface'),
  FACE_SERVICE_URL: z.string().url().default('http://127.0.0.1:8001'),
  MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.45),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_PATH_SECRET: z.string().min(32, 'ADMIN_PATH_SECRET must be at least 32 characters'),
  MAX_SELFIE_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(2),
  THUMB_CACHE_DIR: z.string().default('./.cache/thumbs'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid configuration: ${issues}`);
  }
  return result.data;
}
