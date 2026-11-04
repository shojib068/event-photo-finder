/** Target size keeping aspect ratio, long edge capped at `maxEdge`. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge || long === 0) return { width, height };
  const scale = maxEdge / long;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
