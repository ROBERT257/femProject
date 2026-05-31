SELECT
  w.id AS workout_id,
  w.patient_name,
  w.therapist_name,
  w.title,
  w.start_date
FROM workouts w
LEFT JOIN accounts a
  ON LOWER(TRIM(w.patient_name)) = LOWER(TRIM(a.full_name))
WHERE w.patient_name IS NOT NULL
  AND w.patient_name <> ''
  AND a.id IS NULL
ORDER BY w.id;
