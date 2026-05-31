BEGIN;

ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS patient_id BIGINT NULL REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workouts_patient_id ON workouts(patient_id);

CREATE TABLE IF NOT EXISTS backfill_workouts_patient_id AS
SELECT
  w.id AS workout_id,
  w.patient_id AS old_patient_id,
  a.id AS new_patient_id
FROM workouts w
JOIN accounts a
  ON LOWER(TRIM(w.patient_name)) = LOWER(TRIM(a.full_name))
WHERE w.patient_id IS NULL;

UPDATE workouts
SET patient_id = b.new_patient_id
FROM backfill_workouts_patient_id b
WHERE workouts.id = b.workout_id;

COMMIT;
