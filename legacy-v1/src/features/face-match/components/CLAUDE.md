# face-match/components

Client components for the guest screens. Import siblings by relative path, never `@/features/*`. All text from `@/shared/content`.

- `WelcomeScreen.tsx`: G1, Start goes to `/e/[slug]/selfie`; resets match state on mount.
- `AvailabilityGate.tsx`: wraps the whole `/e/[slug]` flow; loading / error / unavailable / available.
- `NotAvailableScreen.tsx`: G0, one message for every unavailable case, no Start, no camera. Optional `onRetry` shows a secondary Try again (the gate's `recheck`).
- `SearchingScreen.tsx`: G3, reacts to `useMatch()` state: idle -> Selfie, pending -> spinner, match -> `/g/[token]`, no-match -> No Match (all `replace`); quality errors -> Selfie (state kept); NOT_AVAILABLE -> NotAvailableScreen; other errors -> alert + Try again (reset, push Selfie).
- `NoMatchScreen.tsx`: G5, heading from `messages.guest.noMatch` plus a full-width Try again (`reset()` then push Selfie). No photos, counts or Drive info. If state is not `no-match` (reload, direct visit) it `replace`s to Welcome and renders nothing.
