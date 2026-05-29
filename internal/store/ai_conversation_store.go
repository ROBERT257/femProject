package store

import (
	"context"
	"database/sql"
)

// AIConversationStore persists AI chat exchanges.
type AIConversationStore interface {
	SaveConversation(ctx context.Context, userID int64, userMessage, aiResponse string) error
}

// PostgresAIConversationStore stores AI conversations in PostgreSQL.
type PostgresAIConversationStore struct {
	db *sql.DB
}

// NewAIConversationStore creates a PostgreSQL-backed AI conversation store.
func NewAIConversationStore(db *sql.DB) *PostgresAIConversationStore {
	return &PostgresAIConversationStore{db: db}
}

// SaveConversation inserts the exchange into ai_conversations.
func (s *PostgresAIConversationStore) SaveConversation(ctx context.Context, userID int64, userMessage, aiResponse string) error {
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO ai_conversations (user_id, user_message, ai_response)
		VALUES ($1, $2, $3)
	`, userID, userMessage, aiResponse)
	return err
}
