/**
 * Face descriptors from the face engine are non-negative floats. They are stored as one byte per
 * value (scaled by the descriptor's max) to keep index files ~4x smaller than Float32.
 */
export interface EncodedDescriptor {
  d: string;
  s: number;
}

export function encodeDescriptor(values: ArrayLike<number>): EncodedDescriptor {
  let max = 0;
  for (let i = 0; i < values.length; i++) max = Math.max(max, values[i] ?? 0);
  const scale = max > 0 ? max : 1;
  const bytes = new Uint8Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const v = Math.max(0, values[i] ?? 0);
    bytes[i] = Math.round((v / scale) * 255);
  }
  return { d: bytesToBase64(bytes), s: Number(scale.toFixed(6)) };
}

export function decodeDescriptor(encoded: EncodedDescriptor): Float32Array {
  const bytes = base64ToBytes(encoded.d);
  const out = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = ((bytes[i] ?? 0) / 255) * encoded.s;
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] ?? 0);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
