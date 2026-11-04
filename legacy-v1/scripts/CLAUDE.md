# scripts

- `start-local.mjs` (`npm run local`): Postgres via docker, migrations, optional tunnel (`TUNNEL=cloudflared|ngrok`; `NGROK_DOMAIN` pins a permanent ngrok URL), then face-service, worker and the web app. Prints the admin URL. Logs in `.logs/`.
- `migrate.ts` (`npm run db:migrate`): applies `db/migrations/*.sql`.
- `face-service.mjs` / `face-service-install.mjs`: run / install the Python sidecar.
- `wedding.service`: systemd unit to run `npm run local -- --prod` always-on on a VM (see `docs/deploy-free-vm.md`).
