# face-match
Downloads the event index with progress and compares the selfie descriptor with every indexed face in batches (`services/match-index.ts`). Photo matches if any face >= threshold; sorted by score. The descriptor copy is zeroed after the search.
