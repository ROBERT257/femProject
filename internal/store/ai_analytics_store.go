package store

import (
	"context"
	"database/sql"

	"github.com/ROBERT257/femProject/internal/ai"
)

// AIAnalyticsStore persists AI request telemetry.
type AIAnalyticsStore interface {
	SaveRequestAnalytics(ctx context.Context, input ai.RequestAnalytics) error
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
func (s *PostgresAIAnalyticsStore) SaveRequestAnalytics(ctx context.Context, input ai.RequestAnalytics) error {
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
	`, input.UserID, input.RequestType, input.ModelUsed, input.PromptDuration.Milliseconds(), input.TokenCount, input.PromptTokenCount, input.CompletionTokenCount)
	return err
}

var _ AIAnalyticsStore = (*PostgresAIAnalyticsStore)(nil)