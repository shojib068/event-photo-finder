# src/app

Routes only (App Router). Pages render feature components; `api/**/route.ts` call feature handlers. No business logic.
- `/admin/[secret]` admin page, `/e/[slug]` guest flow (+ `/selfie`, `/searching`, `/no-match`), `/g/[token]` private gallery.
