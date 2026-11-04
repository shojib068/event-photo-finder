# Event Photo Finder (multi-event selfie search)

Visitors scan an event's QR code, take a selfie, and get the photos they appear in from that event's
Google Drive folder. Static site on Cloudflare Pages; face matching runs in the visitor's browser.
Full spec: `docs/functional_specification.md` (v2.0). Setup/deploy: `README.md`.
The previous Next.js/Postgres/InsightFace version (v1) is archived in `legacy-v1/` (not built, not linted).

## Features (`src/features/`)
- **event-landing**: loads `/events/<id>.json`, landing page, privacy + consent
- **selfie-capture**: front camera, capture/retake, one-face quality check, face descriptor
- **face-match**: downloads the event's face index, compares in batches with progress
- **results**: grid sorted by similarity, viewer, view original, download, search again
- **photo-proxy**: server handler (Cloudflare Pages Function) that streams photos from private Drive

## Screens
- Follow `docs/screens.md` (landing, selfie, processing, results, not found)

## Commands
- `npm run dev`: start the app (Vite; also serves `/api/photo` locally)
- `npm run index -- <eventId> | --all [--full]`: build/refresh face indexes from Drive
- `npm run qr [-- <eventId>]`: PNG QR codes into `qr-codes/` (uses `SITE_URL`)
- `npm run events:validate`: validate `config/events.json`, write public event metadata
- `npm test`: unit tests
- `npm run lint`: lint and type-check
- `npm run build`: production build (`dist/`)

## Architecture
- Static SPA (React + Vite + TS + Tailwind) + one Pages Function (`functions/api/photo/...`)
- No database, no admin dashboard, no visitor accounts, no always-on server
- Events: `config/events.json` (has Drive folder IDs, developer-only, never served)
- Per-event public files: `public/events/<id>.json` (generated), `public/indexes/<id>.json` (indexer)
- Index files hold encrypted, event-bound photo refs (AES-GCM, `PHOTO_REF_SECRET`), never Drive IDs
- Face recognition: Human (TensorFlow.js) behind `shared/face-engine`; the same config is used by
  the Node indexer (WASM) and the browser (WebGL). Changing model/config => re-index with `--full`
- Feature-first: `src/features/<name>/`, each with an `index.ts` as its only public entry
- Example directories in `docs/directories.md`
- Every folder contains a local CLAUDE.md summarising that directory
- `src/app/` holds routes only (thin, no logic)
- `src/shared/` is for code used by 2+ features (or by features + tools)
- `src/core/` is for config
- Dependencies go one way: `app` -> `features` -> `shared` / `core`; `tools/` and `functions/` may use all

## Conventions
- TypeScript, strict mode
- Features never import from each other; move shared code to `shared/`
- Tests live next to the code (`__tests__/`)
- Config comes from `src/core/config` only (`index.ts` browser, `node.ts` tools); never read env elsewhere
- Conventional commits (`feat:`, `fix:`)
- Keep files small and functions single-purpose

## Do not
- Do not upload, store, log or persist selfies or selfie descriptors (memory only, wiped after search)
- Do not expose Drive file/folder IDs, Drive links or credentials to the browser or in `public/`
- Do not make Drive folders public; the service account reads them (Viewer)
- Do not change an event ID after its QR code has been distributed
- Do not let one event's URL/ref read another event's photos
- Do not commit secrets, `.env` or `secrets/`
- Do not add a database, admin login or dashboard (out of scope)
- Do not add dependencies without a reason
