# src/core/config
`index.ts`: browser config (match threshold, batch and page sizes). `node.ts`: secrets and settings for Node tools (service account, PHOTO_REF_SECRET, SITE_URL, .env loading). Never import `node.ts` from browser code.
