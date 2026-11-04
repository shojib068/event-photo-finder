# drive-connect/components

A1 Admin UI. Client components; import siblings relatively, never `@/features/*`.

- `AdminScreen.tsx`: service email + Copy, add-link form, links list (loading / error / empty / data).
- `AdminEventCard.tsx`: one link row: status badge, progress, Retry, QR + Download QR, Active switch.
- `Admin.module.css`: switch, badge and row layout.
- Data and actions come from `useAdminEvents`, `useAddDriveLink`, `useSetActive` only. All text from `messages.admin`.
