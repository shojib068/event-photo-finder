# tools/indexer
Builds `public/indexes/<id>.json`: lists the Drive folder recursively with pagination (jpg/png/webp only), downloads 1600px Drive thumbnails, detects faces with Human on the WASM backend, encrypts refs. Incremental by Drive md5; checkpoints every 25 photos; atomic writes. Read-only on Drive.
