# core

Infrastructure used by features: `config/` (only reader of process.env), `db/` (pg pool, migrations), `storage/` (Drive client, thumbnail cache), `logger/` (pino with redaction). No business rules here.
