# features/face-match

Compares a guest selfie with the indexed faces of the scanned link only, and owns the guest search flow state.

- `services/match.ts`: availability (ready AND active) -> embed in memory -> quality check -> event-scoped vector search with the fixed threshold (`MATCH_THRESHOLD`, default 0.45 cosine ~ 90% precision) -> create gallery token.
- `services/repository.ts`: pgvector query filtered by `event_id`; gallery creation (128-bit token).
- `services/selfie-quality.ts`: NO_FACE / MULTIPLE_FACES / LOW_QUALITY.
- `services/rate-limit.ts`: 10 matches / minute / IP.
- `api/handlers.ts`: `GET /api/e/:slug`, `POST /api/e/:slug/match`.
- `hooks/match-context.tsx`: `MatchProvider` + `useMatch()` (in-memory state; never storage/URL).
- `hooks/use-event-availability.ts`: re-checks link state on every load.
- `components/`: guest screens Welcome, Not Available, Searching, No Match.
- The selfie is never stored, logged or sent anywhere but face-service.
