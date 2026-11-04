export interface HumanConfigOptions {
  modelBasePath: string;
  backend: 'webgl' | 'wasm' | 'humangl';
  wasmPath?: string;
  maxFaces: number;
}

/**
 * Single source of truth for detector settings so the indexer (Node) and the visitor's browser
 * produce comparable descriptors. Only face detection + mesh + description are enabled.
 */
export function buildHumanConfig(options: HumanConfigOptions) {
  return {
    backend: options.backend,
    modelBasePath: options.modelBasePath,
    wasmPath: options.wasmPath ?? '',
    debug: false,
    async: true,
    cacheSensitivity: 0,
    filter: { enabled: false },
    face: {
      enabled: true,
      detector: { modelPath: 'blazeface.json', rotation: false, maxDetected: options.maxFaces, minConfidence: 0.3, return: false },
      mesh: { enabled: true, modelPath: 'facemesh.json' },
      attention: { enabled: false },
      iris: { enabled: false },
      description: { enabled: true, modelPath: 'faceres.json' },
      emotion: { enabled: false },
      antispoof: { enabled: false },
      liveness: { enabled: false },
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: false },
    segmentation: { enabled: false },
  };
}
