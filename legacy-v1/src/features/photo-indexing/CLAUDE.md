# features/photo-indexing

Background indexing of each Drive link (one event at a time, oldest first).

- `services/worker.ts`: `runIndexingWorker()` loop (5 s poll) used by `worker/index.ts`.
- `services/index-event.ts`: list folder (recursive) -> upsert photos -> download in memory -> FaceProvider -> keep faces (det >= 0.6, >= 40 px) -> store vectors. 3 attempts with backoff, then `failed`. Event `ready` when done (`failed` only if every photo failed).
- `services/repository.ts`: SQL for the queue, photos and faces (idempotent; old faces deleted before re-insert).
- `api/handlers.ts`: `GET /api/admin/:secret/events` (status list) and `POST .../:id/retry`.
