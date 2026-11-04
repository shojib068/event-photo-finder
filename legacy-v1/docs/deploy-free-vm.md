# Run 24/7 for free (Oracle Cloud Always Free VM + ngrok static domain)

The QR code contains `PUBLIC_BASE_URL`. To keep it working forever you need:
1. **A URL that never changes**: a free ngrok static domain (`NGROK_DOMAIN`).
2. **A machine that never sleeps**: an Oracle Cloud "Always Free" VM. Your Mac works too, but only while it's on.

Both machines use the same `NGROK_DOMAIN`, so you print the QR once and it stays valid when you move from the Mac to the VM.

## 1. Free ngrok static domain (do this first, on the Mac)
1. Sign up at https://ngrok.com (free plan).
2. Dashboard -> **Domains** -> claim your free static domain (e.g. `something.ngrok-free.app`).
3. `brew install ngrok` and `ngrok config add-authtoken <your-token>` (token is in the dashboard).
4. In `.env`: `TUNNEL=ngrok` and `NGROK_DOMAIN=something.ngrok-free.app`.
   Keep `PUBLIC_BASE_URL` as the `REPLACE_...` placeholder so the tunnel URL is used.
5. `npm run local`. It should print `Guest links / QR codes use: https://something.ngrok-free.app/e/<slug>`.
6. Re-download the QR from the admin page. Any QR made with a `trycloudflare.com` URL is dead.

Note: free ngrok shows a one-time "You are about to visit…" page in the browser. Guests tap **Visit Site** to continue.

Mac-only option: `caffeinate -s npm run local -- --prod` (after `npm run build`) keeps the Mac awake while plugged in.

## 2. Always-on VM (Oracle Cloud Always Free)
1. Sign up at https://www.oracle.com/cloud/free/. A card is used only for identity checks. Always Free resources are never charged.
2. Create a Compute instance: image **Ubuntu 24.04**, shape **VM.Standard.A1.Flex** (Ampere ARM), 2–4 OCPU, 12–24 GB RAM (all within Always Free).
   You don't need to open any inbound ports, because ngrok connects outbound.
3. SSH in (`ssh ubuntu@<vm-ip>`) and install:
   ```
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 python3 python3-venv python3-pip git build-essential
   sudo usermod -aG docker ubuntu   # log out and back in
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
   curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
   echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
   sudo apt update && sudo apt install -y ngrok
   ngrok config add-authtoken <your-token>
   ```
4. Copy the project from the Mac (no `node_modules`, `.venv` or `.next`). Copy `.env` and `secrets/` directly and **never commit them**:
   ```
   rsync -av --exclude node_modules --exclude .next --exclude 'face-service/.venv' --exclude .logs \
     ~/Personal/Wedding/ ubuntu@<vm-ip>:/home/ubuntu/Wedding/
   ```
5. On the VM: `cd ~/Wedding && npm install && npm run face-service:install && npm run build`.
   If `.env` points `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` at an absolute Mac path, change it to the VM path.
6. **Stop the Mac copy first** (only one ngrok agent can use the domain at a time), then:
   ```
   sudo cp scripts/wedding.service /etc/systemd/system/
   sudo systemctl daemon-reload && sudo systemctl enable --now wedding
   journalctl -u wedding -f      # watch it start
   ```
7. Indexed photos live in the VM's own Postgres. Re-run indexing from the admin page (simplest),
   or copy the Mac DB: `docker compose exec -T db pg_dump -U wedding wedding > dump.sql` on the Mac,
   then `docker compose exec -T db psql -U wedding wedding < dump.sql` on the VM.

## Check
- Scan the QR on a phone: the welcome screen opens over HTTPS and the camera works.
- `sudo reboot` the VM, wait a minute, scan again. It should still work.
