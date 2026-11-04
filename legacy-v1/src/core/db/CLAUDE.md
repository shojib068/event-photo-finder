# core/db

Postgres pool (`getPool`, `query`, `withTransaction`), pgvector helper `toVectorLiteral`, and the migration runner (`migrate.ts`, imported directly, not via index, to keep it out of the app bundle) used by `npm run db:migrate` (SQL files in `db/migrations/`).
