# core/logger

`getLogger()` returns a pino logger with redaction of selfies, images, embeddings, tokens, bodies and Drive IDs. Never pass a selfie or gallery token to the logger, even though they are redacted.
