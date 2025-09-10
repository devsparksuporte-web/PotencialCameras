
CREATE TABLE cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  serial TEXT NOT NULL,
  location TEXT NOT NULL,
  store TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'aviso', 'erro', 'reparo')),
  channels_total INTEGER NOT NULL DEFAULT 4,
  channels_working INTEGER NOT NULL DEFAULT 4,
  channels_blackscreen INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cameras_status ON cameras(status);
CREATE INDEX idx_cameras_store ON cameras(store);
