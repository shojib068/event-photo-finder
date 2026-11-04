# Run locally (with a public HTTPS link)

## One-time setup (already done on this machine)
- `cp .env.example .env` and fill it in
- In `.env`: `TUNNEL=cloudflared` (needs `brew install cloudflared`)
- In `.env`: `ADMIN_PATH_SECRET` set, so the admin link stays the same between restarts
- `npm install` and `npm run face-service:install`

## Every time

1. Start Docker Desktop and wait until it says it's running:
   ```
   ! open -a Docker
   ```
2. Start everything (Postgres, migrations, tunnel, face-service, worker, web app):
   ```
   ! npm run local
   ```
3. Look for this block in the output, which has your links:
   ```
   [local] Admin:  http://localhost:3000/admin/<secret>                    <- local link
   [local] Admin (tunnel): https://<random>.trycloudflare.com/admin/<secret> <- server (public HTTPS) link
   [local] Guest links / QR codes use: https://<random>.trycloudflare.com/e/<slug>
   ```
   - **Local**: `http://localhost:3000`. Only works on this Mac.
   - **Server**: the `https://...trycloudflare.com` URL. Open this one on phones, because the camera needs HTTPS.

## Notes
- **Permanent QR (recommended):** use `TUNNEL=ngrok` + `NGROK_DOMAIN` (free static domain). The URL never
  changes, so the QR stays valid across restarts. To run 24/7 for free, see `docs/deploy-free-vm.md`.
- With `TUNNEL=cloudflared` the tunnel URL is **new every run**. Download or print QR codes only after the
  run you'll keep up, because the QR codes contain that URL.
  Leave `PUBLIC_BASE_URL` as the `REPLACE_...` placeholder in `.env` so the tunnel URL is picked up automatically.
- If there's no `Admin (tunnel)` line, cloudflared didn't connect within 30s. Check `.logs/tunnel.log` and restart.
- Logs: `.logs/*.log`
- Stop: `Ctrl+C`. Postgres keeps running; stop it with `docker compose stop`.
- Production mode: `npm run build`, then `npm run local -- --prod`
