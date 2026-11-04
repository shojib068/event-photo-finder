// One command for local use: Postgres (docker) -> migrations -> [tunnel] -> face-service, worker, web app.
// Usage: npm run local            (next dev)
//        npm run local -- --prod  (next start; run `npm run build` first)
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

try {
  process.loadEnvFile('.env');
} catch {
  console.warn('[local] No .env file found; using defaults. Copy .env.example to .env to configure Drive.');
}

const env = { ...process.env };
const port = env.PORT ?? '3000';
const prod = process.argv.includes('--prod');
const children = [];
mkdirSync('.logs', { recursive: true });

if (!env.ADMIN_PATH_SECRET || env.ADMIN_PATH_SECRET.startsWith('REPLACE_')) {
  // Not a credential: a throwaway path segment for this run only, never written to disk.
  env.ADMIN_PATH_SECRET = randomBytes(24).toString('base64url');
  console.warn('[local] ADMIN_PATH_SECRET is not set in .env; using a temporary one for this run (changes on restart).');
}
if (env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE && !existsSync(env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE)) {
  console.warn(`[local] Service account key file not found: ${env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE}. Drive features will report "not configured".`);
  delete env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
}

function has(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(name, cmd, args, opts = {}) {
  const log = createWriteStream(path.join('.logs', `${name}.log`), { flags: 'a' });
  const child = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  const onData = (chunk) => {
    log.write(chunk);
    for (const line of chunk.toString().split('\n')) if (line.trim()) console.log(`[${name}] ${line}`);
    opts.onLine?.(chunk.toString());
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('exit', (code) => console.log(`[${name}] exited with code ${code}`));
  children.push(child);
  return child;
}

function startTunnel() {
  const kind = env.TUNNEL;
  if (!kind) return Promise.resolve(null);
  if (!has(kind)) {
    console.warn(`[local] TUNNEL=${kind} but "${kind}" is not installed.`);
    return Promise.resolve(null);
  }
  const pattern = kind === 'ngrok' ? /https:\/\/[a-z0-9.-]+\.ngrok(?:-free)?\.(?:app|dev)/ : /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
  // NGROK_DOMAIN: the free static ngrok domain, so the URL (and the printed QR) never changes.
  const ngrokArgs = ['http', port, '--log', 'stdout'];
  if (env.NGROK_DOMAIN) ngrokArgs.push('--url', `https://${env.NGROK_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`);
  const args = kind === 'ngrok' ? ngrokArgs : ['tunnel', '--url', `http://localhost:${port}`];
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 30_000);
    run('tunnel', kind, args, {
      onLine: (text) => {
        const match = text.match(pattern);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      },
    });
  });
}

console.log('[local] Starting Postgres (docker compose)...');
execFileSync('docker', ['compose', 'up', '-d', '--wait'], { stdio: 'inherit' });
console.log('[local] Applying migrations...');
execFileSync('npx', ['tsx', 'scripts/migrate.ts'], { stdio: 'inherit', env });

const tunnelUrl = await startTunnel();
if (tunnelUrl && (!env.PUBLIC_BASE_URL || env.PUBLIC_BASE_URL.includes('REPLACE_'))) env.PUBLIC_BASE_URL = tunnelUrl;
if (!env.PUBLIC_BASE_URL || env.PUBLIC_BASE_URL.includes('REPLACE_')) env.PUBLIC_BASE_URL = `http://localhost:${port}`;

if (existsSync('face-service/.venv/bin/python')) run('face', 'node', ['scripts/face-service.mjs']);
else console.warn('[local] face-service not installed (npm run face-service:install). Indexing and matching will not work.');
run('worker', 'npx', ['tsx', 'worker/index.ts']);
run('web', 'npx', ['next', prod ? 'start' : 'dev', '-p', port]);

console.log('\n[local] ------------------------------------------------------------');
console.log(`[local] Admin:  http://localhost:${port}/admin/${env.ADMIN_PATH_SECRET}`);
if (tunnelUrl) console.log(`[local] Admin (tunnel): ${tunnelUrl}/admin/${env.ADMIN_PATH_SECRET}`);
console.log(`[local] Guest links / QR codes use: ${env.PUBLIC_BASE_URL}/e/<slug>`);
console.log('[local] Logs: .logs/*.log   Stop: Ctrl+C (Postgres keeps running: docker compose stop)');
console.log('[local] ------------------------------------------------------------\n');

function shutdown() {
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1_500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
