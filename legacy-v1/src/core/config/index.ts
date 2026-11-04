import { parseConfig, type Config } from './schema';

export type { Config } from './schema';
export { parseConfig } from './schema';

let cached: Config | undefined;

/** The only place that reads process.env. Validated lazily so `next build` works without secrets. */
export function getConfig(): Config {
  cached ??= parseConfig(process.env);
  return cached;
}
