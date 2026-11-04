# selfie-capture/components

- `SelfieScreen.tsx`: G2 (client). Uses `useCamera` and `useSelfieHandoff`; imports siblings by relative path only. The single `<video>` stays mounted (hidden by CSS when not live) so the hook's `videoRef` is always valid. Preview is mirrored by CSS only. Selfie lives in memory; no storage, logs or download links.
- `SelfieScreen.module.css`: oval guide, 3:4 frame, overlays (CSS module, scoped to this screen).
