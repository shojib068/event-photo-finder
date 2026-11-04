# core/storage

- `drive-client.ts`: Google Drive v3 client with the service account (`drive.readonly`). Read-only; never changes sharing. Folder/file IDs returned here must stay server-side.
- `thumb-cache.ts`: on-disk WebP thumbnail cache keyed by `photo.id` (Drive photos only, never selfies).
