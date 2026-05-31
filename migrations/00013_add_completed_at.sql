-- +goose Up
-- +goose StatementBegin
ALTER TABLE workout_entries
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_workout_entries_completed_at ON workout_entries (completed_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE workout_entries
    DROP COLUMN IF EXISTS completed_at;

DROP INDEX IF EXISTS idx_workout_entries_completed_at;
-- +goose StatementEnd
