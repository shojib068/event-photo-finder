/**
 * Face similarity in 0..1, identical to Human's `match.similarity` with its defaults
 * (order 2, multiplier 25, normalised between 0.2 and 0.8), but without loading TensorFlow.
 */
const MULTIPLIER = 25;
const MIN = 0.2;
const MAX = 0.8;

export function faceSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    sum += diff * diff;
  }
  const distance = MULTIPLIER * sum;
  if (distance === 0) return 1;
  const normalised = (1 - Math.sqrt(distance) / 100 - MIN) / (MAX - MIN);
  return Math.min(1, Math.max(0, normalised));
}
