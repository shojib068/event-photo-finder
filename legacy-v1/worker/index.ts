import { runIndexingWorker } from '@/features/photo-indexing';

const controller = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => controller.abort());
}

await runIndexingWorker(controller.signal);
process.exit(0);
