# features/gallery

Private gallery at `/g/<token>` (128-bit random, non-expiring, unaffected by the Active switch).

- `services/gallery.ts`: client-safe gallery (opaque photo ids), `(token, photo)` pair check.
- `services/photo-stream.ts`: thumbnails (sharp 400 px WebP, disk cache), full-size streamed from Drive, ZIP (archiver, store mode).
- `api/handlers.ts`: `GET /api/g/:token`, `/photos/:photoId`, `/zip`.
- `hooks/`: `useGallery` (+ `galleryUrls`), `useSaveToPhotos` (share-sheet "Save to Photos" in batches of 20; ZIP is a plain native download link), `useShareLink` (Web Share / copy fallback).
- `components/`: Match screen (G4) UI.
- Never expose Drive IDs/URLs; never log the token.
