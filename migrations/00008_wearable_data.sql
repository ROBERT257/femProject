-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS wearable_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    steps INT NOT NULL DEFAULT 0,
    heart_rate INT,
    sleep_hours NUMERIC(4,2),
    calories INT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_id_recorded_at
    ON wearable_data(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_data_source
    ON wearable_data(source);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS wearable_data;
-- +goose StatementEnd