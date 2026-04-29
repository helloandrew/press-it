-- Migration 002: Replace per-click rows with daily aggregates
-- This migration has already been applied to production (2026-04-29)

CREATE TABLE IF NOT EXISTS click_counts (
  user_uuid TEXT NOT NULL,
  date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_uuid, date)
);

CREATE INDEX IF NOT EXISTS idx_click_counts_user_uuid ON click_counts(user_uuid);

DROP TABLE IF EXISTS clicks;
