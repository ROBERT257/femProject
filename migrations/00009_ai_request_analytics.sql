-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS ai_request_analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    prompt_duration_ms BIGINT NOT NULL DEFAULT 0,
    token_count INT NOT NULL DEFAULT 0,
    prompt_token_count INT NOT NULL DEFAULT 0,
    completion_token_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_request_analytics_user_id_created_at
    ON ai_request_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_request_analytics_request_type
    ON ai_request_analytics(request_type);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS ai_request_analytics;
-- +goose StatementEnd