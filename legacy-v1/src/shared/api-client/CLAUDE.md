# shared/api-client

Browser `fetch` wrapper (`apiFetch`, `apiJson`) that throws `ApiError(status, code)` from the `{ error: { code } }` response shape. Feature hooks build their endpoint calls on top of it. Never put selfies or tokens in logs or error messages.
