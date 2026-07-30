-- The slots.status column has a CHECK constraint restricting allowed
-- values, which didn't include 'no_show' when that status was added by the
-- booking scheduler. This drops the old constraint and adds a new one that
-- includes it. Idempotent-safe: DROP ... IF EXISTS won't error if already
-- applied.
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_status_check;
ALTER TABLE slots ADD CONSTRAINT slots_status_check
  CHECK (status IN ('booked', 'checked_in', 'completed', 'cancelled', 'no_show'));
