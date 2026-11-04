// Creates face-service/.venv with Python 3.11 (onnxruntime has no wheels for very new Pythons) and installs requirements.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('face-service');
const candidates = ['/opt/homebrew/bin/python3.11', '/usr/local/bin/python3.11', 'python3.11', 'python3.12'];
const python = candidates.find((p) => {
  try {
    execFileSync(p, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});
if (!python) {
  console.error('Python 3.11 not found. Install it (macOS: brew install python@3.11) and re-run.');
  process.exit(1);
}
const venv = path.join(dir, '.venv');
if (!existsSync(venv)) execFileSync(python, ['-m', 'venv', venv], { stdio: 'inherit' });
execFileSync(path.join(venv, 'bin', 'pip'), ['install', '-r', 'requirements.txt'], { cwd: dir, stdio: 'inherit' });
console.log('face-service installed. The buffalo_l model downloads on first start.');
