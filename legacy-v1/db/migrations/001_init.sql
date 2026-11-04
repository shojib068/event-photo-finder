CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text UNIQUE NOT NULL,
  drive_folder_id  text UNIQUE NOT NULL,
  folder_name      text NOT NULL,
  status           text NOT NULL CHECK (status IN ('pending','indexing','ready','failed')),
  active           boolean NOT NULL DEFAULT false,
  photos_total     int  NOT NULL DEFAULT 0,
  photos_done      int  NOT NULL DEFAULT 0,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  drive_file_id  text NOT NULL,
  file_name      text NOT NULL,
  mime_type      text NOT NULL,
  width          int,
  height         int,
  status         text NOT NULL CHECK (status IN ('pending','done','skipped','failed')),
  attempts       int  NOT NULL DEFAULT 0,
  UNIQUE (event_id, drive_file_id)
);

CREATE TABLE IF NOT EXISTS faces (
  id         bigserial PRIMARY KEY,
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photo_id   uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  embedding  vector(512) NOT NULL,
  bbox       real[4] NOT NULL,
  det_score  real NOT NULL
);
CREATE INDEX IF NOT EXISTS faces_embedding_hnsw ON faces USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS faces_event_id ON faces (event_id);

CREATE TABLE IF NOT EXISTS galleries (
  token       text PRIMARY KEY,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  token     text NOT NULL REFERENCES galleries(token) ON DELETE CASCADE,
  photo_id  uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  score     real NOT NULL,
  PRIMARY KEY (token, photo_id)
);
