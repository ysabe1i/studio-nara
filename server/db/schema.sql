CREATE TABLE IF NOT EXISTS kits (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT        NOT NULL,
  name       TEXT        NOT NULL,
  tag        TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kit_colors (
  id       SERIAL PRIMARY KEY,
  kit_id   INTEGER NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  hex      TEXT    NOT NULL,
  name     TEXT    NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kit_logos (
  id        SERIAL PRIMARY KEY,
  kit_id    INTEGER NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  file_path TEXT    NOT NULL,
  label     TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS kit_fonts (
  id                SERIAL PRIMARY KEY,
  kit_id            INTEGER NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  file_path         TEXT    NOT NULL,
  font_family_name  TEXT    NOT NULL,
  label             TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS projects (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  image_url       TEXT,
  kit_id          INTEGER     REFERENCES kits(id) ON DELETE SET NULL,
  notes_worked    TEXT        NOT NULL DEFAULT '',
  notes_to_change TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- project_id is added below via ALTER TABLE (not inline here), so this file
-- stays safe to run against a database that already has this table without
-- that column.
CREATE TABLE IF NOT EXISTS quick_notes (
  id         SERIAL PRIMARY KEY,
  user_id    TEXT        NOT NULL,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A dated log of reflection entries per project (replaces a single freeform
-- field). Scoped to a user indirectly through projects.user_id, same pattern
-- as kit_colors being scoped through kits.user_id.
CREATE TABLE IF NOT EXISTS project_reflections (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER     NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kits_user_id_idx ON kits (user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);
CREATE INDEX IF NOT EXISTS quick_notes_user_id_idx ON quick_notes (user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS quick_notes_created_at_idx ON quick_notes (created_at DESC);
CREATE INDEX IF NOT EXISTS kit_colors_kit_id_idx ON kit_colors (kit_id);
CREATE INDEX IF NOT EXISTS kit_logos_kit_id_idx ON kit_logos (kit_id);
CREATE INDEX IF NOT EXISTS kit_fonts_kit_id_idx ON kit_fonts (kit_id);

CREATE TABLE IF NOT EXISTS uploads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  filename   TEXT        NOT NULL,
  mime_type  TEXT        NOT NULL,
  size_bytes INTEGER     NOT NULL,
  data       BYTEA       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploads_user_id_idx ON uploads (user_id);

-- Added after the tables above already shipped: needs ADD COLUMN IF NOT
-- EXISTS rather than living in the CREATE TABLE, so this file stays safe to
-- run again against a database that already has quick_notes.
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quick_notes_project_id_idx ON quick_notes (project_id);
CREATE INDEX IF NOT EXISTS project_reflections_project_id_idx ON project_reflections (project_id);