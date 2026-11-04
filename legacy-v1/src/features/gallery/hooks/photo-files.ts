/** Pure helpers for saving photos through the share sheet (no browser APIs except File). */

/** Splits items into groups of `size` (last group may be smaller). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Maps items with at most `limit` running at once; results keep input order. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** File name from a `Content-Disposition` header, or the fallback. */
export function fileNameFromDisposition(header: string | null, fallback: string): string {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] || fallback;
}
