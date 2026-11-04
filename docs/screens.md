# Screen Specification (v2)

**Based on:** Functional Specification v2.0 §5. Single route: `/event/{eventId}`; the steps below are
states of that page, not separate URLs. Text lives in `src/shared/content/messages.ts`.

```
Scan QR → /event/{id} ─┬─ unknown/invalid id → Not Found
                       └─ Landing ─(consent + Start)→ Selfie ─(Continue)→ Processing → Results
                                                       ↑                                  │
                                                       └────────── Search again ──────────┘
```

## Landing / Event page (`features/event-landing`)
- App name + logo, event name, 3-step explanation, privacy information.
- Consent checkbox; **Start searching** enabled only after consent.
- Event not indexed yet → notice instead of the Start button.

## Selfie Capture (`features/selfie-capture`)
- Front camera preview (mirrored) with oval face guide; **Capture**, **Retake**, **Continue**, **Back**.
- Face models load in the background while the camera starts.
- Checks: exactly one prominent face; face not too small. Errors: no face, several faces, too small.
- Camera errors: permission denied (how to allow + Try again), no camera, non-HTTPS.

## Processing (`features/face-match`)
- Progress bar, "Indexed photos" count, "Faces checked x / y", status text.
- Index download with progress, then comparison in batches (UI stays responsive).
- Failure → message + **Try again** (back to Selfie).

## Results (`features/results`)
- "We found N photos of you", responsive grid (2/3/4 columns), sorted by similarity, % match.
- Lazy-loaded thumbnails, **Show more** paging, tap → full-screen viewer (prev/next, keyboard).
- **View original** (new tab) and **Download** per photo; **Search again**.
- No results → helpful message + **Search again**.

## Not Found
- Unknown, malformed or removed event IDs, and any other path.
