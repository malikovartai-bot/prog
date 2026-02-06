-- SQLite schema for the internal AMMA Production portal.

CREATE TABLE IF NOT EXISTS actors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color_hex TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS actor_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status_id INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES actors (id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES availability_statuses (id) ON DELETE RESTRICT,
  UNIQUE (actor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_actor_availability_date
  ON actor_availability (date);

INSERT INTO availability_statuses (code, label, color_hex)
  VALUES
    ('busy', 'Занят', '#ef4444'),
    ('free', 'Свободен', '#22c55e'),
    ('maybe', 'Под вопросом', '#facc15')
  ON CONFLICT(code) DO NOTHING;
