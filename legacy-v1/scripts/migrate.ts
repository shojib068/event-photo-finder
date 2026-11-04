import { getPool } from '@/core/db';
import { runMigrations } from '@/core/db/migrate';

const pool = getPool();
try {
  const applied = await runMigrations(pool);
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
} finally {
  await pool.end();
}
