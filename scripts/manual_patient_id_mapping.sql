BEGIN;

-- Fill this table with the mappings you want to apply manually.
-- Example:
--   INSERT INTO manual_patient_id_mapping (workout_id, patient_id) VALUES (12, 101), (13, 102);

CREATE TEMP TABLE manual_patient_id_mapping (
  workout_id BIGINT PRIMARY KEY,
  patient_id BIGINT NOT NULL
) ON COMMIT DROP;

-- Add rows below before running this script.
-- INSERT INTO manual_patient_id_mapping (workout_id, patient_id) VALUES
--   (1, 1001),
--   (2, 1002);

UPDATE workouts w
SET patient_id = m.patient_id
FROM manual_patient_id_mapping m
WHERE w.id = m.workout_id;

COMMIT;
