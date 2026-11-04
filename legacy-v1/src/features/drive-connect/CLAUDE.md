# features/drive-connect

Admin pastes a Drive folder link; the app validates it and queues it as a new event.

- `services/parse-link.ts`: folder ID from Drive URLs (https, drive.google.com only).
- `services/add-folder.ts`: INVALID_LINK / ALREADY_ADDED / FOLDER_NOT_SHARED (Drive 403/404) / NOT_A_FOLDER / DRIVE_NOT_CONFIGURED, else inserts `events` row (pending, inactive, random slug).
- `api/handlers.ts`: `POST /api/admin/:secret/events`.
- `hooks/`: admin page client hooks: `useAddDriveLink` (Add form), `useAdminEvents` (3 s polling, stops when nothing is queued/indexing), `useSetActive` (Active switch). They call endpoints owned by photo-indexing/qr-code over HTTP only.
- `components/`: admin screen UI (A1).
- Drive folder IDs never leave the server.
