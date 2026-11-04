# photo-proxy (server-side)
`handlePhotoRequest` for `GET /api/photo/:eventId/:ref?size=thumb|full&download=1`: decrypts the event-bound ref, gets a read-only Drive token for the service account (WebCrypto JWT), streams the Drive thumbnail or original. Runs in Cloudflare Pages Functions and in the Vite dev server. Never imported by browser code.
