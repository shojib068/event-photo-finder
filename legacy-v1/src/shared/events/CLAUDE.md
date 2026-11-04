# shared/events

The `events` table (one row per Drive link): types, SQL repository, and the availability rules used by several features:
- `isEventAvailable`: status = ready AND active (QR/selfie entry point).
- `canActivate`: ready with at least one photo.
- `toEventSummary`: client-safe view (no Drive IDs).
