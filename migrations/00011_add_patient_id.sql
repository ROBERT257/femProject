-- +goose Up
-- +goose StatementBegin
ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS patient_id BIGINT NULL REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workouts_patient_id ON workouts(patient_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE workouts
    DROP COLUMN IF EXISTS patient_id;

DROP INDEX IF EXISTS idx_workouts_patient_id;
-- +goose StatementEnd
