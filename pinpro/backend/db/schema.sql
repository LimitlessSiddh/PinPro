-- PinPro schema as the code expects it. There are no migrations; production was created by hand,
-- so column types there may differ (e.g. clubs.distance is read defensively as NUMERIC).
-- Used to build the disposable test database: npm run test:db
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,   -- email for Google users
  password_hash TEXT,                   -- null for Google users
  firebase_uid  TEXT,
  handicap      NUMERIC                 -- legacy, no longer written
);
CREATE TABLE IF NOT EXISTS clubs (
  user_id  INTEGER REFERENCES users(id),
  name     TEXT,
  distance NUMERIC
);
CREATE TABLE IF NOT EXISTS rounds (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  total_holes   INTEGER,
  shots         INTEGER,
  final_score   INTEGER,                -- relative to par
  par           INTEGER,
  shot_data     JSONB,
  course_name   TEXT,
  slope_rating  NUMERIC,
  course_rating NUMERIC,
  created_at    TIMESTAMPTZ DEFAULT now()
);
