import { FaceServiceDownError, type DetectedFace, type FaceProvider } from './types';

interface EmbedResponse {
  faces: { embedding: number[]; bbox: [number, number, number, number]; det_score: number }[];
}

/** Calls the local Python face-service (InsightFace buffalo_l). Image bytes go only to 127.0.0.1. */
export class InsightFaceProvider implements FaceProvider {
  constructor(private readonly baseUrl: string, private readonly timeoutMs = 30_000) {}

  async detectAndEmbed(image: Buffer): Promise<DetectedFace[]> {
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(image)]), 'image');
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/embed`, { method: 'POST', body: form, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (err) {
      throw new FaceServiceDownError(err);
    }
    if (res.status === 400) return [];
    if (!res.ok) throw new FaceServiceDownError(`status ${res.status}`);
    const data = (await res.json()) as EmbedResponse;
    return data.faces.map((f) => ({ embedding: Float32Array.from(f.embedding), bbox: f.bbox, detScore: f.det_score }));
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3_000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
