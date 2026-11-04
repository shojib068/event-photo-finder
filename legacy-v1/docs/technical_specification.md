# Technical Specification: Wedding Face-Search Photo Web App

**Version:** 1.1 (multiple Drive links, one QR per link)
**Based on:** [functional_specification.md](./functional_specification.md) v2.1

## 1. Overview and scope

Guests scan a QR code, take a selfie, and get a private gallery of the photos they appear in. Photos live in private Google Drive folders. The admin can add several Drive links; each link is its own **event** with its own index, status and QR code. The app indexes each folder once, then answers selfie searches for that event only.

**In scope:** one admin page (add multiple Drive links, see each link's status, one QR code per link; a QR code works only while its link is **active**, i.e. indexing is finished and the admin has switched it on), guest flow (welcome, selfie, search, gallery or no match), background indexing, private galleries with download and share.

**Out of scope:** admin login, analytics or settings pages, live-sync of new Drive photos, matching across events, storing selfies, cloud hosting (later).

## 2. Architecture

```
 Guest phone / admin browser
            │ HTTPS
            ▼
 ┌──────────────────────┐
 │ Cloudflare Tunnel    │  public HTTPS URL → localhost:3000
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐   HTTP (127.0.0.1)   ┌──────────────────────┐
 │ Next.js app          │ ───────────────────▶ │ face-service (Python)│
 │ routes + API handlers│                      │ FastAPI + InsightFace│
 └──────┬───────────┬───┘                      └──────────▲───────────┘
        │           │ Drive API (read-only)               │
        │           ▼                                     │
        │   ┌──────────────┐                              │
        │   │ Google Drive │◀──────────┐                  │
        │   └──────────────┘           │                  │
        ▼                              │                  │
 ┌──────────────────────┐      ┌───────┴──────────────────┴┐
 │ Postgres + pgvector  │◀─────│ Worker (npm run worker)   │
 └──────────────────────┘      │ indexing job              │
                               └───────────────────────────┘
```

| Process | Role |
|---|---|
| **Next.js app** (`npm run dev`) | Admin page, guest pages, API handlers. Embeds selfies via face-service and queries pgvector. Proxies photos from Drive. |
| **Worker** (`npm run worker`) | Polls for events to index, one at a time in the order they were added. Lists and downloads Drive photos, sends them to face-service, stores face vectors. |
| **face-service** | Stateless Python service. Detects faces and returns 512-d ArcFace embeddings. Bound to `127.0.0.1` only. |
| **Postgres + pgvector** | Events, photos, faces (vectors), galleries. |
| **Cloudflare Tunnel** | Gives the local app a public HTTPS URL so phone cameras work. |

**Dependency direction:** `src/app` → `src/features/*` → `src/shared` / `src/core`. Features never import each other; they only expose `index.ts`.

## 3. Tech stack

| Area | Choice | Reason |
|---|---|---|
| Web app | Next.js (App Router), React, TypeScript strict | Routes, API handlers and UI in one app; matches `src/app` layout |
| Database | Postgres 16 + `pgvector` | One store for data and vector search; easy to move to cloud |
| DB client | `pg` with plain SQL in repository files | Small, no ORM needed for 5 tables |
| Migrations | Plain SQL files in `db/migrations/`, run by a small script | Avoids a migration framework |
| Drive | `googleapis` (Drive v3) with a service account | Official client; service account = "app's email address" |
| Images (Node) | `sharp` | Thumbnails and resizing |
| QR | `qrcode` | PNG/SVG QR generation |
| ZIP | `archiver` | Streams ZIP downloads without temp files |
| Validation | `zod` | Validate env config and API input |
| Logging | `pino` | Structured logs with redaction |
| Tests | Vitest (TS), pytest (Python) | Fast unit tests next to code |
| Face model | Python 3.11, FastAPI, `insightface` (`buffalo_l`: RetinaFace + ArcFace), `onnxruntime` | Open source, local, no per-photo cost |

## 4. Directory layout

Follows `docs/directories.md`. Every folder has a short `CLAUDE.md` describing it.

```
src/
├── app/                          # routes only, no business logic
│   ├── admin/[secret]/page.tsx   # admin page (list of Drive links)
│   ├── e/[slug]/page.tsx         # guest flow (welcome → selfie → result)
│   ├── g/[token]/page.tsx        # private gallery
│   └── api/...                   # thin handlers calling feature index.ts
├── features/
│   ├── drive-connect/
│   ├── photo-indexing/
│   ├── qr-code/
│   ├── selfie-capture/
│   ├── face-match/
│   └── gallery/
│       ├── CLAUDE.md
│       ├── index.ts              # only public entry
│       ├── components/  hooks/  services/  providers/  api/
│       ├── types.ts  constants.ts
│       └── __tests__/
├── shared/                       # code used by 2+ features (e.g. face provider types, token utils)
└── core/
    ├── config/                   # the only place that reads process.env
    ├── db/                       # pg pool, migrations runner
    ├── storage/                  # Drive client, thumbnail cache
    └── logger/
worker/index.ts                   # worker entry, calls photo-indexing
face-service/                     # Python sidecar (app.py, requirements.txt, tests/)
db/migrations/                    # SQL files
docker-compose.yml                # Postgres + pgvector
```

## 5. Data model

Each Drive link the admin adds is one row in `events`. Two separate fields describe it:

- `status` is set by the system (indexing progress).
- `active` is set by the admin (on/off switch).

A QR code works for guests only when `status = 'ready' AND active = true`.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,        -- random, used in the QR URL
  drive_folder_id  text UNIQUE NOT NULL,        -- server-only, never sent to clients
  folder_name      text NOT NULL,               -- Drive folder name, shown on the admin page
  status           text NOT NULL CHECK (status IN ('pending','indexing','ready','failed')),
  active           boolean NOT NULL DEFAULT false,  -- admin switch; QR works only when true and ready
  photos_total     int  NOT NULL DEFAULT 0,
  photos_done      int  NOT NULL DEFAULT 0,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- public, opaque
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  drive_file_id  text NOT NULL,                                -- server-only
  file_name      text NOT NULL,
  mime_type      text NOT NULL,
  width          int,
  height         int,
  status         text NOT NULL CHECK (status IN ('pending','done','skipped','failed')),
  attempts       int  NOT NULL DEFAULT 0,
  UNIQUE (event_id, drive_file_id)
);

CREATE TABLE faces (
  id         bigserial PRIMARY KEY,
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,  -- denormalized for filtered search
  photo_id   uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  embedding  vector(512) NOT NULL,     -- L2-normalized ArcFace embedding
  bbox       real[4] NOT NULL,         -- x, y, w, h in original pixels
  det_score  real NOT NULL
);
CREATE INDEX faces_embedding_hnsw ON faces USING hnsw (embedding vector_cosine_ops);
CREATE INDEX faces_event_id ON faces (event_id);

CREATE TABLE galleries (
  token       text PRIMARY KEY,        -- 128-bit random, base64url (22 chars)
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gallery_photos (
  token     text NOT NULL REFERENCES galleries(token) ON DELETE CASCADE,
  photo_id  uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  score     real NOT NULL,
  PRIMARY KEY (token, photo_id)
);
```

Notes:
- Galleries store only photo references and scores. No selfie, no embedding of the guest.
- Galleries do not expire (functional rule).
- Adding a Drive folder that is already in the list returns the existing event (`drive_folder_id` is unique).
- Events are not deleted by the app. The admin switches a link off to stop its QR code.
- Galleries keep working after their event is switched off: the switch controls only the QR / selfie entry point, and gallery links do not expire.

## 6. Face provider

### 6.1 TypeScript interface (`src/shared/face-provider/`)

```ts
export interface DetectedFace {
  embedding: Float32Array;          // 512 values, L2-normalized
  bbox: [number, number, number, number];
  detScore: number;                 // 0..1
}

export interface FaceProvider {
  detectAndEmbed(image: Buffer): Promise<DetectedFace[]>;
  health(): Promise<boolean>;
}
```

- `InsightFaceProvider` calls face-service over HTTP. It is the default implementation.
- A `FakeFaceProvider` returns fixed vectors for unit tests.
- The provider is picked in `core/config` (`FACE_PROVIDER=insightface`). Swapping the model means adding a new class, not changing callers.

### 6.2 face-service (Python)

| Endpoint | Input | Output |
|---|---|---|
| `POST /embed` | `multipart/form-data` field `image` (JPEG/PNG/HEIC) | `{ "faces": [{ "embedding": number[512], "bbox": [x,y,w,h], "det_score": number }] }` |
| `GET /health` | – | `{ "ok": true, "model": "buffalo_l" }` |

- Loads `buffalo_l` once at startup (`det_size=640x640`), CPU by default (`onnxruntime`), CoreML/GPU optional.
- Decodes with Pillow (+ `pillow-heif` for HEIC), applies EXIF rotation, downsizes the long edge to 1600px before detection.
- Stateless: images are processed in memory and never written to disk or logged.
- Binds to `127.0.0.1`; only the app and worker can reach it.
- Rejects bodies over 20 MB with `413`.

## 7. Features

### 7.1 drive-connect

**Exports:** `parseDriveFolderLink(link)`, `validateDriveFolder(folderId)`, `addDriveFolder(link)`, `getServiceAccountEmail()`.

- Parses folder ID from links like `https://drive.google.com/drive/folders/<id>?usp=sharing` and `.../drive/u/0/folders/<id>`.
- Validates with `files.get(folderId, fields: id,name,mimeType)` using the service account (scope `drive.readonly`):
  - `404`/`403` → `FOLDER_NOT_SHARED` (page tells the admin to share with the shown email).
  - `mimeType !== application/vnd.google-apps.folder` → `NOT_A_FOLDER`.
- If the folder is already in the list → `ALREADY_ADDED` with the existing event.
- On success creates an `events` row with `status = pending`, `active = false`, the folder `name` and a random `slug`. The admin can add more links at any time; each one is queued for indexing.

### 7.2 photo-indexing

**Exports:** `runIndexingWorker()`, `getIndexingStatus(eventId)`, `listEventStatuses()`.

Worker loop (every 5 s):
1. Claim the oldest `pending` event (`ORDER BY created_at ... FOR UPDATE SKIP LOCKED`), set `indexing`. Other events wait as `pending`.
2. List images in the folder (`files.list`, `q: '<id>' in parents and trashed = false and mimeType contains 'image/'`, paginated, recursive into subfolders). Upsert `photos` rows; set `photos_total`.
3. Process `pending` photos with `WORKER_CONCURRENCY` (default 2):
   - Download bytes (`files.get alt=media`) into memory.
   - Call `FaceProvider.detectAndEmbed`.
   - Keep faces with `det_score ≥ 0.6` and short side ≥ 40 px; insert into `faces` with the event's `event_id`.
   - Mark photo `done` (or `skipped` for unsupported types); increment `photos_done`.
   - On error, retry up to 3 times with exponential backoff, then mark `failed`.
4. When no `pending` photos remain, set event `ready` (`failed` only if every photo failed). Then pick the next `pending` event.

Idempotent: restarting the worker resumes from photos not yet `done`. A photo's old faces are deleted before re-insert.

### 7.3 qr-code

**Exports:** `buildEventUrl(slug)`, `renderQr(url, format: 'png' | 'svg')`, `isEventAvailable(event)`.

- One QR code per Drive link. URL: `${PUBLIC_BASE_URL}/e/${slug}`.
- The QR code is shown on that link's row once status is `ready`, with a **Download** button (PNG, 1024 px, error correction `M`) and an **Active** on/off switch.
- The QR image itself never changes. Whether it "works" is decided on the server when a guest opens it: `isEventAvailable` returns true only when `status = 'ready' AND active = true`.
- When the event is not available, the guest page shows "These photos are not available right now." and no camera is opened.

### 7.4 selfie-capture

**Exports:** `<SelfieCamera />`, `useCamera()`, `checkSelfieQuality(faces)`.

Client:
- `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })`, oval face-guide overlay, capture to `<canvas>`, mirrored preview, **Retake**.
- Downscale to max 720 px long edge, encode JPEG quality 0.85, upload as `multipart/form-data`.
- Clear camera stream and canvas after upload.
- Clear errors for camera permission denied and no HTTPS.

Server quality check (on the embed result, before matching):

| Condition | Error code | Guest message |
|---|---|---|
| No face | `NO_FACE` | "We couldn't see a face. Please try again." |
| More than one face with `det_score ≥ 0.6` | `MULTIPLE_FACES` | "Please make sure only you are in the photo." |
| Face too small (< 15% of image width) or `det_score < 0.7` | `LOW_QUALITY` | "Move closer and make sure your face is well lit." |

### 7.5 face-match

**Exports:** `matchSelfie(eventId, imageBuffer): Promise<MatchResult>`.

1. Check that the event from the QR slug is available (`ready` and `active`); otherwise `NOT_AVAILABLE`.
2. Embed the selfie in memory via `FaceProvider` and run the quality check.
3. Query nearest faces in **that event only** (a guest never sees photos from another Drive link):
   ```sql
   SELECT f.photo_id, MAX(1 - (f.embedding <=> $1)) AS score
   FROM faces f
   WHERE f.event_id = $2 AND 1 - (f.embedding <=> $1) >= $3
   GROUP BY f.photo_id ORDER BY score DESC LIMIT 500;
   ```
4. No rows → `{ match: false }`.
5. Rows → create a gallery (`token` + `gallery_photos`) and return `{ match: true, token }`.
6. The selfie buffer and embedding go out of scope; nothing is stored.

**Threshold.** The functional spec says "about 90%". ArcFace cosine similarity for the same person is usually 0.4–0.8, so a raw cosine of 0.9 would miss most real matches. The "90%" is treated as a target **precision** (about 9 in 10 returned photos are correct). It is set with a fixed cosine threshold, `MATCH_THRESHOLD`, default **0.45**, to be tuned on real wedding photos before the event (see §15). It is fixed per deployment, not set by the guest.

### 7.6 gallery

**Exports:** `getGallery(token)`, `streamPhoto(token, photoId, size)`, `streamZip(token)`, `<GalleryGrid />`, `<PhotoViewer />`.

- `/g/<token>`: responsive grid of thumbnails, tap opens a full-screen viewer with swipe.
- **Download single:** `GET /api/g/:token/photos/:photoId?size=full&download=1` (`Content-Disposition: attachment`).
- **Download all:** `GET /api/g/:token/zip` streams a ZIP with `archiver` (`store` mode, since JPEGs are already compressed).
- **Share:** `navigator.share({ url })` with the gallery link; fallback copies the link to the clipboard.
- Every photo request checks the `(token, photo_id)` pair exists in `gallery_photos`, so a token cannot reach photos outside its gallery.
- Photos are fetched from Drive by the server; the client only sees app URLs with opaque `photo.id`.

## 8. HTTP API

All handlers live in `src/app/api/**/route.ts` and only call feature exports. Errors use `{ "error": { "code": string, "message": string } }`.

| Method & path | Input | Success | Errors |
|---|---|---|---|
| `GET /api/admin/:secret/events` | – | `200 { serviceAccountEmail, events: [{ id, folderName, status, active, photosTotal, photosDone, qrUrl? }] }` | `404` wrong secret |
| `POST /api/admin/:secret/events` | `{ driveLink: string }` | `201 { id, status: "pending", active: false }` | `400 INVALID_LINK`, `400 NOT_A_FOLDER`, `403 FOLDER_NOT_SHARED`, `409 ALREADY_ADDED`, `404` |
| `PATCH /api/admin/:secret/events/:id` | `{ active: boolean }` | `200 { id, active }` | `404`, `409 NOT_READY` (cannot activate before indexing finishes) |
| `GET /api/admin/:secret/events/:id/qr?format=png\|svg` | – | QR image | `404`, `409 NOT_READY` |
| `GET /api/e/:slug` | – | `200 { available: boolean }` | `404` |
| `POST /api/e/:slug/match` | `multipart` field `selfie` (≤ 5 MB, JPEG/PNG) | `200 { match: true, token }` or `200 { match: false }` | `400 NO_FACE \| MULTIPLE_FACES \| LOW_QUALITY`, `403 NOT_AVAILABLE` (not ready or switched off), `413`, `429`, `503 FACE_SERVICE_DOWN` |
| `GET /api/g/:token` | – | `200 { photos: [{ id, width, height }] }` | `404` |
| `GET /api/g/:token/photos/:photoId?size=thumb\|full&download=0\|1` | – | image bytes | `404` |
| `GET /api/g/:token/zip` | – | `application/zip` stream | `404` |

The admin page polls `GET /events` every 3 s. Each row shows the folder name, *Queued / Indexing… (n / total) / Ready / Failed*, and, when ready, the QR code, its download button and the **Active** switch. A form at the top adds another Drive link.

## 9. Security and privacy

| Rule | How it is enforced |
|---|---|
| Selfie never stored, logged or sent anywhere except the matcher | Read into memory with a size limit, sent only to face-service on `127.0.0.1`, never written to disk, DB or logs. Logger redacts request bodies. face-service logs no image data. |
| Drive file IDs never exposed | API returns only `photos.id` (UUID). `drive_folder_id` / `drive_file_id` are excluded from all response types; logger redacts them. |
| Drive folder never made public | Service account with `drive.readonly`; the admin shares the folder with that one email. The app never changes sharing settings. |
| Unguessable gallery links | `crypto.randomBytes(16).toString('base64url')` (128 bits). Event slugs use the same method. |
| No admin login (by spec) | Admin page lives at `/admin/<ADMIN_PATH_SECRET>`; any other path returns `404`. Secret comes from config. |
| Abuse of matching | Rate limit `POST /match`: 10 requests / minute / IP (in-memory). |
| Switched-off QR codes | `/api/e/:slug` and `/match` check `status = 'ready' AND active = true` on every request, so switching a link off takes effect immediately. |
| Isolation between links | Every match query filters by the event of the scanned QR; galleries reference only photos of that event. |
| Secrets | `.env` is gitignored; `.env.example` lists keys without values. Only `src/core/config` reads `process.env`, validated with `zod` at startup. |
| Headers | `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` (keeps gallery tokens out of referrers), `Cache-Control: private` on gallery responses, `X-Robots-Tag: noindex` on `/e` and `/g`. |
| Camera | `Permissions-Policy: camera=(self)`. HTTPS through the tunnel. |

## 10. Configuration

All values are read and validated in `src/core/config`.

| Variable | Example / default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgres://wedding:wedding@localhost:5432/wedding` | Postgres connection |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | `./secrets/service-account.json` | Service account key (gitignored) |
| `FACE_PROVIDER` | `insightface` | Provider implementation |
| `FACE_SERVICE_URL` | `http://127.0.0.1:8001` | face-service address |
| `MATCH_THRESHOLD` | `0.45` | Cosine similarity cut-off |
| `PUBLIC_BASE_URL` | `https://wedding.example.com` | Tunnel URL used in the QR code |
| `ADMIN_PATH_SECRET` | 32+ random chars | Admin page path segment |
| `MAX_SELFIE_BYTES` | `5242880` | Upload size limit |
| `WORKER_CONCURRENCY` | `2` | Photos processed in parallel |
| `THUMB_CACHE_DIR` | `./.cache/thumbs` | Thumbnail cache (gitignored) |
| `LOG_LEVEL` | `info` | Logger level |

## 11. Performance and caching

- **Expected size:** 1,000–3,000 photos and 5,000–15,000 faces per Drive link; a few links in total. Queries return in well under 100 ms on a laptop.
- **Filtered vector search:** HNSW with a `WHERE event_id = …` filter can return too few rows when one event is a small share of all faces. Enable pgvector iterative scans (`SET hnsw.iterative_scan = relaxed_order`, pgvector ≥ 0.8). At this size an exact scan per event is also fast enough and is the fallback.
- **Indexing time:** about 0.3–0.6 s per photo on a modern CPU → roughly 10–30 min for 2,000 photos at concurrency 2. Links are indexed one after another, so a later link waits for earlier ones.
- **Thumbnails:** generated with `sharp` (400 px, WebP) on first request and cached on disk by `photo.id`. These are derived from Drive photos, never from selfies. Full-size images are streamed from Drive and cached by the browser (`Cache-Control: private, max-age=86400`).
- **Selfie path:** client downscaling keeps uploads around 100–200 KB, so search takes about 1 s end to end.

## 12. Hosting and runbook (local)

1. `docker compose up -d` — Postgres 16 with pgvector (`pgvector/pgvector:pg16`).
2. `npm run db:migrate` — apply `db/migrations/*.sql`.
3. `cd face-service && uvicorn app:app --host 127.0.0.1 --port 8001` — model downloads on first start.
4. `npm run dev` (or `npm run build && npm start`).
5. `npm run worker`.
6. `cloudflared tunnel --url http://localhost:3000` (or a named tunnel for a stable host); set `PUBLIC_BASE_URL` to it **before** generating the QR code.
7. Open `/admin/<ADMIN_PATH_SECRET>`, paste one or more Drive links, wait for each to show *Ready*, switch it **Active**, and download its QR code.

A named tunnel (stable domain) is recommended so the printed QR code keeps working across restarts.

**Moving to cloud later:** containerize the app, worker and face-service; use a managed Postgres with pgvector; swap `DATABASE_URL` and `PUBLIC_BASE_URL`; keep face-service on a private network.

## 13. Testing

- **Unit (Vitest, `__tests__/` next to code):**
  - Drive link parsing (valid formats, junk input).
  - Token generation (length, charset, uniqueness).
  - Selfie quality rules.
  - Match service with `FakeFaceProvider`: threshold, dedupe per photo, ordering, no-match.
  - Gallery access: photo outside the token's gallery returns 404.
  - Event availability: QR/match rejected when the event is pending, indexing, failed or switched off; cannot activate before `ready`.
  - Match isolation: a selfie matched through one event never returns photos from another event.
  - Adding the same Drive folder twice returns `ALREADY_ADDED`.
  - Config validation fails on missing variables.
  - API responses never include `drive_*` fields.
- **face-service (pytest):** `/embed` returns one face for a sample portrait, zero for a blank image, `413` for large bodies.
- **Calibration script:** run labeled sample selfies against an indexed folder and print precision/recall per threshold, to pick `MATCH_THRESHOLD`.
- **Manual end-to-end:** through the tunnel on iOS Safari and Android Chrome: camera permission, capture, match, no-match, download single, ZIP, share; scan a switched-off QR code and see the not-available message.
- `npm run lint` (ESLint + `tsc --noEmit`) and `npm test` must pass before commit.

## 14. Logging and errors

- `pino` JSON logs from `src/core/logger`, with redaction of `selfie`, `image`, `embedding`, `drive_*`, `token` and request bodies.
- Log events: link added, activated or deactivated (by event `id`), indexing start/finish, per-photo failures (by `photo.id`), face-service unavailable, match counts (number only, no scores per guest).
- Guest-facing errors are short and friendly; technical detail stays in logs.
- If face-service is down, `/match` returns `503` and the guest sees "Something went wrong, please try again shortly."

## 15. Open items

- Welcome, sorry and "not available" message text (to be provided).
- Calibrate `MATCH_THRESHOLD` on real wedding photos to reach about 90% precision.
- Confirm whether the photographer delivers HEIC or RAW files (RAW is not supported; HEIC is supported through `pillow-heif`, thumbnails would need a HEIC-capable `sharp` build or conversion in face-service).
- Stable tunnel domain to use in the printed QR codes.
