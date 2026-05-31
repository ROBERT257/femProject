-- +goose Up
-- +goose StatementBegin
ALTER TABLE workout_entries
    ADD COLUMN IF NOT EXISTS fatigue_level INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_workout_entries_fatigue_level ON workout_entries (fatigue_level);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE workout_entries
    DROP COLUMN IF EXISTS fatigue_level;

DROP INDEX IF EXISTS idx_workout_entries_fatigue_level;
-- +goose StatementEnd
