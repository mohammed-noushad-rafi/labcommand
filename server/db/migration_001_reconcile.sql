-- Migration 001: reconcile schema.sql with columns/tables the code already
-- depends on but that were added ad-hoc to the live DB during development.
-- Safe to run multiple times.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department VARCHAR(50);

ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS department VARCHAR(50);

ALTER TABLE slots
  ADD COLUMN IF NOT EXISTS assigned_to   INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notes         TEXT;

CREATE TABLE IF NOT EXISTS technicians (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  department       VARCHAR(50),
  specialization   VARCHAR(100),
  contact_number   VARCHAR(20),
  is_available     BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT NOW()
);