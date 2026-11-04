# Event Photo Finder

Multi-event, QR-based selfie photo finder. One website, one permanent URL and QR code per event,
one Google Drive folder and face index per event. No database, no admin dashboard, no local server.

```
QR code → https://<site>/event/<eventId>
          │  landing + consent → selfie (camera, in browser) → face descriptor (in memory)
          │  → download /indexes/<eventId>.json → compare faces in browser → results
          └─ photos: /api/photo/<eventId>/<encrypted ref>  (Pages Function → private Drive)
```

## How it fits together

| Piece | Where | Notes |
|---|---|---|
| Event list | `config/events.json` | id, name, Drive folder ID (or link), indexPath |
| Face index | `public/indexes/<id>.json` | built by `npm run index`, committed and deployed |
| Event metadata | `public/events/<id>.json` | generated at build; no Drive info |
| Photo proxy | `functions/api/photo/[eventId]/[ref].ts` | Cloudflare Pages Function, service account |
| QR codes | `qr-codes/<id>.png` | `npm run qr`, points to `SITE_URL/event/<id>` |

Drive folders stay **private**. They are shared (Viewer) with a Google service account. The browser
only ever sees encrypted photo refs, and each ref works only under its own event's URL.

## One-time setup

1. `npm install`
2. Google Cloud: enable the **Google Drive API** and create a **service account** with a JSON key. Save the key as
   `secrets/service-account.json`.
3. `cp .env.example .env` and set:
   - `PHOTO_REF_SECRET`: generate with
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
     Keep it forever. Changing it means re-running `npm run index -- --all --full`.
   - `SITE_URL`: the permanent production URL, e.g. `https://yourwebsite.pages.dev`
4. Cloudflare Pages: create a project from the GitHub repo.
   - Build command `npm run build`, output directory `dist`, Node 22+ (`NODE_VERSION=22`)
   - Environment variables (Production, **encrypted**):
     - `GOOGLE_SERVICE_ACCOUNT_JSON`: the whole service-account JSON file contents
     - `PHOTO_REF_SECRET`: same value as in `.env`
   - Optional build variable: `VITE_MATCH_THRESHOLD` (default `0.6`)

## Add an event

1. Share the Drive folder with the service account's `client_email` (Viewer).
2. Add it to `config/events.json`:
   ```json
   { "id": "birthday-2026", "name": "Birthday 2026", "folderId": "<folder ID or folder link>", "indexPath": "/indexes/birthday-2026.json" }
   ```
3. `npm run index -- birthday-2026` (runs on your computer; uses Drive thumbnails at 1600px)
4. `npm run qr -- birthday-2026` → `qr-codes/birthday-2026.png`
5. Commit and push (Cloudflare Pages deploys automatically), then print or share the QR code.

New photos added to a folder: `npm run index -- <id>` (only new or changed photos are analysed;
deleted photos are removed), then commit and push. Use `--full` after changing the face model settings.

**Never rename an event ID after its QR code is out.** Existing QR codes keep working across deploys.

## Local development

`npm run dev` serves the app at http://localhost:5173, including the photo proxy (it reads `.env`).
Phone cameras need HTTPS, so test phones against the deployed site or a Pages preview deployment.

## Matching

- Model: Human `faceres` descriptors (1024-d, stored as 1 byte per value). Similarity is 0..1.
- `VITE_MATCH_THRESHOLD` (default 0.6). Measured on real event photos: same person 0.52–0.99
  (reclined or tilted heads and sunglasses score lowest); different people up to ~0.78.
  Raise it for fewer look-alikes, lower it to miss fewer photos. Results are sorted by similarity.
- Matches are possible matches, not identity verification.

## Limits (free tier)

- Cloudflare Pages: 25 MiB per file (≈ 18,000 faces per event index), 20,000 files per deploy.
- Pages Functions free plan: 100,000 requests/day (each thumbnail or download is one request).
- Google Drive API quotas apply to the proxy and the indexer.
- Anyone with an event's URL can browse that event's photos through its index (like a shared album).
  Matching happens in the browser, so the server cannot restrict photos to "matched only".
- The visitor's device does the matching; a 2,000-photo event downloads a ~3–5 MB index (≈1.5 KB per face).
