# face-service

Python sidecar (FastAPI + InsightFace `buffalo_l`: RetinaFace + ArcFace) that detects faces and returns 512-d L2-normalized embeddings.

- `POST /embed` (multipart field `image`) -> `{ faces: [{ embedding, bbox: [x,y,w,h], det_score }] }`
- `GET /health` -> `{ ok, model }`
- Stateless: images stay in memory, are never written to disk or logged.
- Binds to `127.0.0.1:8001` only (`npm run face-service`).
- Install: `npm run face-service:install` (creates `.venv` with Python 3.11).
- Tests: `.venv/bin/pytest tests`.
