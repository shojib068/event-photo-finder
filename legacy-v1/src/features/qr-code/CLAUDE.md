# features/qr-code

One QR code per Drive link, pointing to `${PUBLIC_BASE_URL}/e/<slug>`, plus the Active switch.

- `services/qr.ts`: `buildEventUrl`, `renderQr` (PNG 1024 px / SVG, error correction M).
- `services/set-active.ts`: Active can be turned on only when ready with photos; off always allowed; galleries unaffected.
- `api/handlers.ts`: `GET /api/admin/:secret/events/:id/qr`, `PATCH /api/admin/:secret/events/:id`.
- `isEventAvailable` lives in `shared/events` (also used by face-match) and is re-exported here.
