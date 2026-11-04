# src/features

One folder per feature (drive-connect, photo-indexing, qr-code, selfie-capture, face-match, gallery). `index.ts` is the only public entry; features never import each other. Client components never import a feature `index.ts` (it includes server code).
