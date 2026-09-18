-- Migration 0010: Product Analytics and Observability Baseline
-- Digital Campus v2: M0 Privacy-Preserving Event Ingestion & Operational Metrics

CREATE TABLE IF NOT EXISTS analytics_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event           TEXT NOT NULL,
  actor_id        INTEGER,
  session_id      TEXT,
  room_id         INTEGER,
  route           TEXT,
  status_code     INTEGER,
  duration_ms     INTEGER,
  error_class     TEXT,
  properties_json TEXT,
  created_at      INTEGER NOT NULL,
  created_date    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_date_event  ON analytics_events(created_date, event);
CREATE INDEX IF NOT EXISTS idx_analytics_actor_date   ON analytics_events(actor_id, created_date);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at   ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_room_event   ON analytics_events(room_id, event);
CREATE INDEX IF NOT EXISTS idx_analytics_route_status ON analytics_events(route, status_code);
