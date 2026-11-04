import { getConfig } from '@/core/config';
import { InsightFaceProvider } from './insightface-provider';
import type { FaceProvider } from './types';

export * from './types';
export { InsightFaceProvider } from './insightface-provider';
export { FakeFaceProvider, fakeEmbedding } from './fake-provider';

let provider: FaceProvider | undefined;

/** Picks the provider from config (FACE_PROVIDER). Add a class + case here to swap models. */
export function getFaceProvider(): FaceProvider {
  if (!provider) {
    const config = getConfig();
    switch (config.FACE_PROVIDER) {
      case 'insightface':
        provider = new InsightFaceProvider(config.FACE_SERVICE_URL);
        break;
    }
  }
  return provider;
}
