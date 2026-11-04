# shared/face-provider

`FaceProvider` interface (`detectAndEmbed`, `health`), the default `InsightFaceProvider` (HTTP to face-service on 127.0.0.1), and `FakeFaceProvider` for tests. `getFaceProvider()` picks the implementation from config. Used by photo-indexing and face-match.
