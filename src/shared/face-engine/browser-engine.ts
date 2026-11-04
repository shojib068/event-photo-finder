import { DESCRIPTOR_LENGTH, FACE_MODEL_ID } from './constants';
import { buildHumanConfig } from './human-config';
import { toDetectedFaces, type RawFace } from './to-detected-faces';
import type { DetectedFace, FaceEngine } from './types';

let enginePromise: Promise<FaceEngine> | null = null;

async function createBrowserEngine(): Promise<FaceEngine> {
  // Loaded lazily: TensorFlow.js is large and only needed once the visitor starts.
  const { Human } = await import('@vladmandic/human');
  const config = buildHumanConfig({
    backend: 'webgl',
    modelBasePath: `${window.location.origin}/models/`,
    wasmPath: `${window.location.origin}/models/wasm/`,
    maxFaces: 5,
  });
  const human = new Human(config as never);
  await human.load();
  await human.warmup();
  return {
    modelId: FACE_MODEL_ID,
    async detect(input): Promise<DetectedFace[]> {
      const result = await human.detect(input as HTMLCanvasElement);
      const faces = toDetectedFaces(result.face as unknown as RawFace[]);
      return faces.filter((f) => f.descriptor.length === DESCRIPTOR_LENGTH);
    },
  };
}

/** Shared, lazily created face engine for the browser. */
export function getBrowserFaceEngine(): Promise<FaceEngine> {
  enginePromise ??= createBrowserEngine().catch((error: unknown) => {
    enginePromise = null;
    throw error;
  });
  return enginePromise;
}
