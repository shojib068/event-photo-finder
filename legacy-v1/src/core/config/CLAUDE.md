# core/config

The only place that reads `process.env`. `getConfig()` validates with zod (lazily, on first use) and caches. Add every new setting to `schema.ts` and `.env.example`.
