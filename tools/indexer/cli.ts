/**
 * npm run index -- <eventId> [--full]     index one event
 * npm run index -- --all [--full]         index every event in config/events.json
 *
 * Re-running only analyses new or changed photos (use --full to redo everything).
 * Afterwards: commit public/indexes/*.json and deploy.
 */
import { getPhotoRefSecret, getServiceAccount } from '../../src/core/config/node';
import { fail, log } from '../shared/log';
import { findEvent, loadEvents } from '../shared/load-events';
import { buildEventIndex } from './build-index';
import { DriveClient } from './drive-client';
import { createNodeFaceEngine } from './node-face-engine';

async function main() {
  const args = process.argv.slice(2);
  const full = args.includes('--full');
  const ids = args.filter((a) => !a.startsWith('--'));
  const events = loadEvents();
  const targets = args.includes('--all') ? events : ids.map((id) => findEvent(events, id));
  if (targets.length === 0) throw new Error('Usage: npm run index -- <eventId> | --all [--full]');

  const secret = getPhotoRefSecret();
  const drive = new DriveClient(getServiceAccount());
  log('loading face models…');
  const engine = await createNodeFaceEngine();
  for (const event of targets) await buildEventIndex(event, { drive, engine, secret }, { full });
  log('done. Next: npm run build (or commit + push) to deploy the updated index.');
}

main().catch(fail);
