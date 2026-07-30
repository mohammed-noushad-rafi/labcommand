-- Adds tracking for automated booking reminders, so the scheduler doesn't
-- send the same reminder twice. Idempotent — safe to run multiple times.
ALTER TABLE slots ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
