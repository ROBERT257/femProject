-- +goose Up
-- +goose StatementBegin
-- Backfill `workouts.patient_id` from `accounts.id` using `patient_name` → `accounts.full_name` match.
-- This creates a backup table `backfill_workouts_patient_id` recording (workout_id, old_patient_id, new_patient_id)
-- so the operation is reversible in the Down migration.
BEGIN;

CREATE TABLE IF NOT EXISTS backfill_workouts_patient_id AS
SELECT
  w.id AS workout_id,
  w.patient_id AS old_patient_id,
  a.id AS new_patient_id
FROM workouts w
JOIN accounts a ON LOWER(TRIM(w.patient_name)) = LOWER(TRIM(a.full_name))
WHERE w.patient_id IS NULL;

-- Preview matches (run this manually before applying):
-- SELECT COUNT(*) FROM backfill_workouts_patient_id;
-- SELECT * FROM backfill_workouts_patient_id LIMIT 50;

-- Apply the updates for the matched rows
UPDATE workouts
SET patient_id = b.new_patient_id
FROM backfill_workouts_patient_id b
WHERE workouts.id = b.workout_id;

COMMIT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
BEGIN;

-- Revert updates using the backup table, then drop the backup
UPDATE workouts
SET patient_id = b.old_patient_id
FROM backfill_workouts_patient_id b
WHERE workouts.id = b.workout_id;

DROP TABLE IF EXISTS backfill_workouts_patient_id;

COMMIT;
-- +goose StatementEnd
