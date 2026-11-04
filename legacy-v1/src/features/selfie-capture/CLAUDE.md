# features/selfie-capture

Front-camera selfie in the browser.

- `hooks/use-camera.ts`: getUserMedia (`facingMode: 'user'`), status (denied / unsupported / insecure), capture, stop tracks, revoke object URLs.
- `services/capture.ts`: frame -> canvas -> JPEG (max 720 px, quality 0.85); canvas cleared after.
- `components/`: Selfie screen (G2): live preview, oval face guide, Capture, Retake, Use this photo.
- Privacy: the selfie lives in memory only. Never localStorage/sessionStorage/IndexedDB/cache/URL/router state/logs. Sent only to `POST /api/e/:slug/match` (via face-match's `useMatch().submit`).
- The server-side quality check lives in face-match (features cannot import each other).
