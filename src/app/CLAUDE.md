# src/app
Routes only, no business logic. `App.tsx` picks a route via `match-route.ts` (`/event/:id` or not found). `routes/EventRoute.tsx` wires the feature screens (landing -> selfie -> searching -> results) together.
