package store

import (
	"context"
	"database/sql"
)

// AIAnalyticsStore persists AI request telemetry.
type AIAnalyticsStore interface {
	SaveRequestAnalytics(ctx context.Context, input RequestAnalytics) error
}

// RequestAnalytics stores AI request telemetry.
type RequestAnalytics struct {
	UserID               int64
	RequestType          string
	ModelUsed            string
	PromptDuration       int64
	TokenCount           int
	PromptTokenCount     int
	CompletionTokenCount int
}

// PostgresAIAnalyticsStore stores AI request telemetry in PostgreSQL.
type PostgresAIAnalyticsStore struct {
	db *sql.DB
}

// NewAIAnalyticsStore creates a PostgreSQL-backed AI analytics store.
func NewAIAnalyticsStore(db *sql.DB) *PostgresAIAnalyticsStore {
	return &PostgresAIAnalyticsStore{db: db}
}

// SaveRequestAnalytics inserts telemetry into ai_request_analytics.
func (s *PostgresAIAnalyticsStore) SaveRequestAnalytics(ctx context.Context, input RequestAnalytics) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO ai_request_analytics (
			user_id,
			request_type,
			model_used,
			prompt_duration_ms,
			token_count,
			prompt_token_count,
			completion_token_count
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, input.UserID, input.RequestType, input.ModelUsed, input.PromptDuration, input.TokenCount, input.PromptTokenCount, input.CompletionTokenCount)
	return err
}

var _ AIAnalyticsStore = (*PostgresAIAnalyticsStore)(nil)