-- Test mirror of migrations/0012_engagement_study_days.sql

CREATE TABLE IF NOT EXISTS study_activity_days (
  account_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  study_date TEXT NOT NULL,
  source_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, study_date)
);

CREATE INDEX IF NOT EXISTS idx_study_activity_days_acc_date ON study_activity_days(account_id, study_date DESC);
