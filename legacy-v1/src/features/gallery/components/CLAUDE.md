# gallery/components

G4 Match / Gallery UI. Client components; import siblings relatively, never `@/features/*`.

- `GalleryScreen.tsx`: loading / not-found / error / empty / ready states, "Save all to Photos" (phones) or ZIP link (computers) + share actions.
- `SaveAllButton.tsx`: batch button states (prepare, progress, save, next batch, finished).
- `GalleryGrid.tsx`: square lazy thumbnails (buttons) that open the viewer.
- `PhotoViewer.tsx`: modal viewer (arrows, keys, swipe, download, close, scroll lock).
- `Gallery.module.css`: grid and viewer styles.
- URLs come from `useGallery().urls` only. Never log or display the token.
