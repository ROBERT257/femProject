package store

import (
	"context"
	"database/sql"
	"time"
)

// WearableData stores a single wearable sample.
type WearableData struct {
	ID         int64
	UserID     int64
	Source     string
	Steps      int
	HeartRate  sql.NullInt64
	SleepHours sql.NullFloat64
	Calories   sql.NullInt64
	RecordedAt time.Time
}

// WearableStore defines database access for wearable samples.
type WearableStore interface {
	SaveDataPoint(ctx context.Context, data *WearableData) error
	ListByUser(ctx context.Context, userID int64) ([]WearableData, error)
	// Connection management for OAuth wearable providers
	SaveWearableConnection(ctx context.Context, conn *WearableConnection) error
	GetWearableConnection(ctx context.Context, userID int64, provider string) (*WearableConnection, error)
}

// PostgresWearableStore persists wearable samples in PostgreSQL.
type PostgresWearableStore struct {
	db *sql.DB
}

// NewWearableStore creates a wearable store backed by PostgreSQL.
func NewWearableStore(db *sql.DB) *PostgresWearableStore {
	return &PostgresWearableStore{db: db}
}

// SaveDataPoint inserts one wearable record.
func (s *PostgresWearableStore) SaveDataPoint(ctx context.Context, data *WearableData) error {
	return s.db.QueryRowContext(ctx, `
		INSERT INTO wearable_data (user_id, source, steps, heart_rate, sleep_hours, calories, recorded_at)
		VALUES ($1, $2, $3, NULLIF($4, 0), NULLIF($5, 0), NULLIF($6, 0), COALESCE($7, CURRENT_TIMESTAMP))
		RETURNING id
	`, data.UserID, data.Source, data.Steps, data.HeartRate.Int64, data.SleepHours.Float64, data.Calories.Int64, data.RecordedAt).Scan(&data.ID)
}

// ListByUser returns recent wearable records for one user.
func (s *PostgresWearableStore) ListByUser(ctx context.Context, userID int64) ([]WearableData, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, user_id, source, steps, heart_rate, sleep_hours, calories, recorded_at
		FROM wearable_data
		WHERE user_id = $1
		ORDER BY recorded_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []WearableData
	for rows.Next() {
		var item WearableData
		if err := rows.Scan(&item.ID, &item.UserID, &item.Source, &item.Steps, &item.HeartRate, &item.SleepHours, &item.Calories, &item.RecordedAt); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, nil
}

// WearableConnection represents OAuth tokens for a wearable provider.
type WearableConnection struct {
	ID           int64
	UserID       int64
	Provider     string
	AccessToken  string
	RefreshToken string
	TokenExpiry  sql.NullTime
	CreatedAt    time.Time
}

// SaveWearableConnection inserts or updates a wearable connection.
func (s *PostgresWearableStore) SaveWearableConnection(ctx context.Context, conn *WearableConnection) error {
	// Try update first
	if conn.ID != 0 {
		_, err := s.db.ExecContext(ctx, `
			UPDATE wearable_connections SET access_token = $1, refresh_token = $2, token_expiry = $3
			WHERE id = $4
		`, conn.AccessToken, conn.RefreshToken, nullTimeOrNil(conn.TokenExpiry), conn.ID)
		return err
	}

	// Upsert by user_id + provider
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO wearable_connections (user_id, provider, access_token, refresh_token, token_expiry)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, provider) DO UPDATE
		  SET access_token = EXCLUDED.access_token,
			  refresh_token = EXCLUDED.refresh_token,
			  token_expiry = EXCLUDED.token_expiry
		RETURNING id, created_at
	`, conn.UserID, conn.Provider, conn.AccessToken, conn.RefreshToken, nullTimeOrNil(conn.TokenExpiry)).Scan(&conn.ID, &conn.CreatedAt)
	return err
}

// GetWearableConnection fetches a wearable connection for a user and provider.
func (s *PostgresWearableStore) GetWearableConnection(ctx context.Context, userID int64, provider string) (*WearableConnection, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, provider, access_token, refresh_token, token_expiry, created_at
		FROM wearable_connections
		WHERE user_id = $1 AND provider = $2
	`, userID, provider)

	var wc WearableConnection
	var tokenExpiry sql.NullTime
	if err := row.Scan(&wc.ID, &wc.UserID, &wc.Provider, &wc.AccessToken, &wc.RefreshToken, &tokenExpiry, &wc.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	wc.TokenExpiry = tokenExpiry
	return &wc, nil
}

func nullTimeOrNil(t sql.NullTime) interface{} {
	if t.Valid {
		return t.Time
	}
	return nil
}
