SELECT
  w.id AS workout_id,
  w.patient_name,
  a.id AS account_id,
  a.full_name
FROM workouts w
JOIN accounts a
  ON LOWER(TRIM(w.patient_name)) = LOWER(TRIM(a.full_name))
ORDER BY w.id;
