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
