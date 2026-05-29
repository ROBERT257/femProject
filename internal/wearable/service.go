package wearable

import (
	"context"
	"database/sql"
	"time"

	"github.com/ROBERT257/femProject/internal/store"
)

// Service coordinates wearable sync operations.
type Service struct {
	store     store.WearableStore
	googleFit *GoogleFitClient
}

// NewService creates a wearable service.
func NewService(store store.WearableStore, googleFit *GoogleFitClient) *Service {
	return &Service{store: store, googleFit: googleFit}
}

// Sync stores wearable data from the configured source or a placeholder Google Fit feed.
func (s *Service) Sync(ctx context.Context, userID int64, source string, data []DataPoint) ([]DataPoint, error) {
	if len(data) == 0 && s.googleFit != nil {
		items, err := s.googleFit.SyncUserData(ctx, userID)
		if err != nil {
			return nil, err
		}
		data = items
	}

	results := make([]DataPoint, 0, len(data))
	for _, item := range data {
		recordedAt := item.RecordedAt
		if recordedAt.IsZero() {
			recordedAt = time.Now().UTC()
		}
		row := &store.WearableData{
			UserID:     userID,
			Source:     sourceOrDefault(source, item.Source),
			Steps:      item.Steps,
			RecordedAt: recordedAt,
		}
		if item.HeartRate != nil {
			row.HeartRate = nullInt64(*item.HeartRate)
		}
		if item.SleepHours != nil {
			row.SleepHours = nullFloat64(*item.SleepHours)
		}
		if item.Calories != nil {
			row.Calories = nullInt64(*item.Calories)
		}
		if err := s.store.SaveDataPoint(ctx, row); err != nil {
			return nil, err
		}
		item.ID = row.ID
		item.UserID = userID
		item.Source = row.Source
		item.RecordedAt = row.RecordedAt
		results = append(results, item)
	}

	return results, nil
}

// List returns stored wearable rows for a user.
func (s *Service) List(ctx context.Context, userID int64) ([]DataPoint, error) {
	items, err := s.store.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	results := make([]DataPoint, 0, len(items))
	for _, item := range items {
		point := DataPoint{
			ID:         item.ID,
			UserID:     item.UserID,
			Source:     item.Source,
			Steps:      item.Steps,
			RecordedAt: item.RecordedAt,
		}
		if item.HeartRate.Valid {
			value := int(item.HeartRate.Int64)
			point.HeartRate = &value
		}
		if item.SleepHours.Valid {
			value := item.SleepHours.Float64
			point.SleepHours = &value
		}
		if item.Calories.Valid {
			value := int(item.Calories.Int64)
			point.Calories = &value
		}
		results = append(results, point)
	}

	return results, nil
}

func sourceOrDefault(source, fallback string) string {
	if source != "" {
		return source
	}
	if fallback != "" {
		return fallback
	}
	return "manual"
}

func nullInt64(value int) sql.NullInt64 {
	return sql.NullInt64{Int64: int64(value), Valid: true}
}

func nullFloat64(value float64) sql.NullFloat64 {
	return sql.NullFloat64{Float64: value, Valid: true}
}
