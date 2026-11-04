## Example directories

src/features/face-match/
|__CLAUDE.md
├── index.ts          # public API: the only file other code may import
├── components/       # UI for this feature only
├── hooks/
├── services/         # business logic (threshold, ranking)
├── providers/        # face provider adapter (Rekognition or InsightFace)
├── api/              # request handlers
├── types.ts
├── constants.ts
└── __tests__/        # unit tests next to the code