import { toVectorLiteral, withTransaction } from '@/core/db';
import { randomToken } from '@/shared/tokens';
import { MATCH_LIMIT } from '../constants';
import type { PhotoMatch } from '../types';

/** Nearest faces in ONE event only, best score per photo, above the fixed threshold. */
export async function searchFaces(eventId: string, embedding: Float32Array, threshold: number): Promise<PhotoMatch[]> {
  return withTransaction(async (client) => {
    // Filtered HNSW can return too few rows; relaxed iterative scan fixes that (pgvector >= 0.8).
    await client.query('SET LOCAL hnsw.iterative_scan = relaxed_order').catch(() => undefined);
    const res = await client.query<{ photo_id: string; score: number }>(
      `SELECT f.photo_id, MAX(1 - (f.embedding <=> $1)) AS score
       FROM faces f
       WHERE f.event_id = $2 AND 1 - (f.embedding <=> $1) >= $3
       GROUP BY f.photo_id ORDER BY score DESC LIMIT ${MATCH_LIMIT}`,
      [toVectorLiteral(embedding), eventId, threshold],
    );
    return res.rows.map((r) => ({ photoId: r.photo_id, score: Number(r.score) }));
  });
}

/** Creates a private gallery (128-bit random token) holding only photo references and scores. */
export async function createGallery(eventId: string, matches: PhotoMatch[]): Promise<string> {
  const token = randomToken();
  await withTransaction(async (client) => {
    await client.query('INSERT INTO galleries (token, event_id) VALUES ($1, $2)', [token, eventId]);
    for (const m of matches) {
      await client.query(
        `INSERT INTO gallery_photos (token, photo_id, score)
         SELECT $1, p.id, $3 FROM photos p WHERE p.id = $2 AND p.event_id = $4`,
        [token, m.photoId, m.score, eventId],
      );
    }
  });
  return token;
}
