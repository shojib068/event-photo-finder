/**
 * npm run events:validate
 * Validates config/events.json and writes public/events/<id>.json for every event
 * (removing files of events that no longer exist). Runs automatically before every build.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fail, log } from '../shared/log';
import { loadEvents } from '../shared/load-events';
import { PUBLIC_DIR } from '../shared/paths';
import { buildPublicMeta } from './public-meta';

function main() {
  const events = loadEvents();
  const dir = path.join(PUBLIC_DIR, 'events');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const event of events) {
    const meta = buildPublicMeta(event);
    writeFileSync(path.join(dir, `${event.id}.json`), JSON.stringify(meta));
    log(`${event.id}: ${meta.indexed ? `${meta.photoCount} photos, ${meta.faceCount} faces` : 'NOT INDEXED yet (run npm run index -- ' + event.id + ')'}`);
  }
  log(`${readdirSync(dir).length} event(s) OK`);
}

try {
  main();
} catch (error) {
  fail(error);
}
