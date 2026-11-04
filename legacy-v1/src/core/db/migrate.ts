import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type pg from 'pg';

/** Applies db/migrations/*.sql in name order, once each. */
export async function runMigrations(pool: pg.Pool, dir = path.resolve('db/migrations')): Promise<string[]> {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await pool.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(dir, file), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      applied.push(file);
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
  return applied;
}
