# shared/face-engine
Face provider interface and the Human (TensorFlow.js) setup shared by the browser (`browser-engine.ts`, lazy, WebGL) and the Node indexer. `similarity.ts` reproduces Human's similarity without loading TF. Changing config or model => re-index all events with --full.
