/**
 * npm run qr                 PNG QR code for every event → qr-codes/<eventId>.png
 * npm run qr -- <eventId>    one event
 * Uses SITE_URL from .env (permanent https production domain).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { getSiteUrl } from '../../src/core/config/node';
import { fail, log } from '../shared/log';
import { findEvent, loadEvents } from '../shared/load-events';
import { QR_DIR } from '../shared/paths';
import { checkProductionUrl, eventUrl } from './production-url';

async function main() {
  const base = checkProductionUrl(getSiteUrl());
  const events = loadEvents();
  const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const targets = ids.length ? ids.map((id) => findEvent(events, id)) : events;
  mkdirSync(QR_DIR, { recursive: true });
  for (const event of targets) {
    const url = eventUrl(base, event.id);
    const file = path.join(QR_DIR, `${event.id}.png`);
    await QRCode.toFile(file, url, { type: 'png', width: 1200, margin: 4, errorCorrectionLevel: 'Q' });
    log(`${event.id}: ${url} → ${path.relative(process.cwd(), file)}`);
  }
}

main().catch(fail);
