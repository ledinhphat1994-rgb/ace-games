-- ==============================================================================
-- 73-campus-highlight-audience.sql
-- Add audience ('public' | 'school') and set_id to campus_highlight_curation
-- Ensures strict privacy isolation between anonymous Guests and school members.
-- ==============================================================================

ALTER TABLE campus_highlight_curation ADD COLUMN audience TEXT NOT NULL DEFAULT 'school';
ALTER TABLE campus_highlight_curation ADD COLUMN set_id TEXT;

CREATE INDEX IF NOT EXISTS idx_chc_audience_active ON campus_highlight_curation(audience, active, sort_order);
