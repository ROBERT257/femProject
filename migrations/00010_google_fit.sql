-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS wearable_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS wearable_data (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source TEXT NOT NULL,
    steps INTEGER DEFAULT 0,
    heart_rate INTEGER,
    sleep_hours DOUBLE PRECISION,
    calories INTEGER,
    activity_type TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_recorded_at ON wearable_data (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_user_provider ON wearable_connections (user_id, provider);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_wearable_connections_user_provider;
DROP INDEX IF EXISTS idx_wearable_data_user_recorded_at;
DROP TABLE IF EXISTS wearable_data;
DROP TABLE IF EXISTS wearable_connections;
-- +goose StatementEnd
