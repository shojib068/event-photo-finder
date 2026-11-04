// Starts the Python face-service on 127.0.0.1:8001 from face-service/.venv.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('face-service');
const python = path.join(dir, '.venv', 'bin', 'python');
if (!existsSync(python)) {
  console.error('face-service/.venv not found. Run: npm run face-service:install');
  process.exit(1);
}
const child = spawn(python, ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8001', '--no-access-log'], {
  cwd: dir,
  stdio: 'inherit',
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
