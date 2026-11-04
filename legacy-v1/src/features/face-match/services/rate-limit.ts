import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '../constants';

/** In-memory sliding-window limiter (single local process). */
export function createRateLimiter(max = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS, now = () => Date.now()) {
  const hits = new Map<string, number[]>();
  return function allow(key: string): boolean {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((h) => t - h < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 10_000) hits.clear();
    return true;
  };
}
