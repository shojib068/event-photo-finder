# gallery/hooks

Client hooks for gallery. Data fetching and state live here, not in components.

- `use-gallery.ts`: loads the gallery; `galleryUrls` builds app-only photo/ZIP URLs.
- `use-save-to-photos.ts`: phones only (Web Share with files). Batches of 20, 3 downloads at once, two taps per batch (prepare, then share) because iOS needs the share call straight from a tap. Files live in memory for one batch only.
- `photo-files.ts`: pure helpers (`chunk`, `mapLimit`, `fileNameFromDisposition`), tested in `__tests__/photo-files.test.ts`.
- `use-share-link.ts`: shares the gallery link (Web Share / copy fallback).
- The ZIP is never fetched in JS: it is a plain `<a download>` so the browser streams it to disk.
