-- +goose Up
-- +goose StatementBegin
ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS therapist_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS goal TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE workout_entries
    ADD COLUMN IF NOT EXISTS completion_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS pain_level INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS patient_notes TEXT,
    ADD COLUMN IF NOT EXISTS therapist_comments TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE workout_entries
    DROP COLUMN IF EXISTS therapist_comments,
    DROP COLUMN IF EXISTS patient_notes,
    DROP COLUMN IF EXISTS pain_level,
    DROP COLUMN IF EXISTS completion_status;

ALTER TABLE workouts
    DROP COLUMN IF EXISTS start_date,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS goal,
    DROP COLUMN IF EXISTS therapist_name,
    DROP COLUMN IF EXISTS patient_name;
-- +goose StatementEnd