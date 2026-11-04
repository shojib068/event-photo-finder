import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { buildHumanConfig, DESCRIPTOR_LENGTH, toDetectedFaces, type DetectedFace, type RawFace } from '../../src/shared/face-engine';
import { ROOT } from '../shared/paths';

const require = createRequire(path.join(ROOT, 'package.json'));

/** TensorFlow.js fetches models with fetch(); Node's fetch cannot read file:// URLs. */
function allowFileFetch(): void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith('file://')) return new Response(await readFile(fileURLToPath(url)));
    return original(input, init);
  }) as typeof fetch;
}

export interface NodeFaceEngine {
  detect(image: Buffer, maxSide: number): Promise<{ faces: DetectedFace[]; width: number; height: number }>;
}

/** Same Human configuration as the browser, running on the TensorFlow.js WASM backend. */
export async function createNodeFaceEngine(): Promise<NodeFaceEngine> {
  allowFileFetch();
  // The package's "exports" map does not expose the WASM build, so load it by path.
  const { Human } = require(path.join(ROOT, 'node_modules/@vladmandic/human/dist/human.node-wasm.js'));
  const tf = require('@tensorflow/tfjs-core');
  const config = buildHumanConfig({
    backend: 'wasm',
    modelBasePath: pathToFileURL(path.join(ROOT, 'node_modules/@vladmandic/human/models')).href + '/',
    wasmPath: path.join(ROOT, 'node_modules/@tensorflow/tfjs-backend-wasm/dist') + '/',
    maxFaces: 100,
  });
  const human = new Human(config);
  await human.load();

  return {
    async detect(image, maxSide) {
      const { data, info } = await sharp(image).rotate().resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');
      try {
        const result = await human.detect(tensor);
        const faces = toDetectedFaces(result.face as RawFace[]).filter((f) => f.descriptor.length === DESCRIPTOR_LENGTH);
        return { faces, width: info.width, height: info.height };
      } finally {
        tensor.dispose();
      }
    },
  };
}
