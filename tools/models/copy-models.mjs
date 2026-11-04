// Copies the face models and TensorFlow WASM binaries into public/models so the site never
// depends on a third-party CDN at runtime.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'public/models');
const humanModels = path.join(root, 'node_modules/@vladmandic/human/models');
const wasmDir = path.join(root, 'node_modules/@tensorflow/tfjs-backend-wasm/dist');
const MODELS = ['blazeface', 'facemesh', 'faceres'];

mkdirSync(path.join(out, 'wasm'), { recursive: true });
for (const name of MODELS) {
  for (const ext of ['json', 'bin']) cpSync(path.join(humanModels, `${name}.${ext}`), path.join(out, `${name}.${ext}`));
}
for (const file of readdirSync(wasmDir).filter((f) => f.endsWith('.wasm'))) cpSync(path.join(wasmDir, file), path.join(out, 'wasm', file));
console.log(`[models] copied ${MODELS.join(', ')} + wasm to public/models`);
