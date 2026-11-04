import pg from 'pg';
import { getConfig } from '@/core/config';

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  pool ??= new pg.Pool({ connectionString: getConfig().DATABASE_URL, max: 10 });
  return pool;
}

export async function query<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

/** Runs `fn` inside a transaction on one client. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** pgvector literal for a Float32Array / number[]. */
export function toVectorLiteral(values: ArrayLike<number>): string {
  return `[${Array.from(values).join(',')}]`;
}

