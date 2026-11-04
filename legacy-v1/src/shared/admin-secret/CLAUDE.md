# shared/admin-secret

`isAdminSecret(segment)`: constant-time check of the admin path secret. Every admin route and API handler calls it and returns 404 on mismatch.
