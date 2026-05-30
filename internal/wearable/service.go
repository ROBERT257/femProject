package wearable

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/ROBERT257/femProject/internal/store"
	"golang.org/x/oauth2"
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
		items, err := s.SyncUserData(ctx, userID)
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

// SyncUserData fetches data from Google Fit for a user and persists it.
func (s *Service) SyncUserData(ctx context.Context, userID int64) ([]DataPoint, error) {
	// Load connection
	conn, err := s.store.GetWearableConnection(ctx, userID, providerGoogle)
	if err != nil {
		return nil, err
	}
	if conn == nil {
		return nil, nil
	}

	// Build oauth2 config
	cfg := buildOAuthConfig()
	if cfg == nil {
		return nil, fmt.Errorf("oauth config not configured")
	}

	// Prepare token
	token := &oauth2.Token{AccessToken: conn.AccessToken, RefreshToken: conn.RefreshToken}
	if conn.TokenExpiry.Valid {
		token.Expiry = conn.TokenExpiry.Time
	}

	// TokenSource will refresh token if needed
	ts := cfg.TokenSource(ctx, token)
	newToken, err := ts.Token()
	if err != nil {
		return nil, err
	}

	// Persist refreshed token if changed
	if newToken.AccessToken != conn.AccessToken || (newToken.RefreshToken != "" && newToken.RefreshToken != conn.RefreshToken) || !conn.TokenExpiry.Valid || newToken.Expiry.After(conn.TokenExpiry.Time) {
		conn.AccessToken = newToken.AccessToken
		if newToken.RefreshToken != "" {
			conn.RefreshToken = newToken.RefreshToken
		}
		if !newToken.Expiry.IsZero() {
			conn.TokenExpiry = sql.NullTime{Time: newToken.Expiry, Valid: true}
		}
		if err := s.store.SaveWearableConnection(ctx, conn); err != nil {
			return nil, err
		}
	}

	// Create an HTTP client that will attach the token
	httpClient := oauth2.NewClient(ctx, oauth2.StaticTokenSource(newToken))

	// Define time range: last 24 hours
	end := time.Now().UTC()
	start := end.Add(-24 * time.Hour)

	// Fetch metrics
	gf := s.googleFit
	if gf == nil {
		return nil, fmt.Errorf("google fit client not configured")
	}
	steps, _ := gf.FetchSteps(ctx, httpClient, start, end)
	hr, _ := gf.FetchHeartRate(ctx, httpClient, start, end)
	calories, _ := gf.FetchCalories(ctx, httpClient, start, end)
	sleep, _ := gf.FetchSleep(ctx, httpClient, start, end)

	dp := DataPoint{
		UserID:     userID,
		Source:     providerGoogle,
		Steps:      steps,
		RecordedAt: end,
	}
	if hr > 0 {
		dp.HeartRate = &hr
	}
	if calories > 0 {
		c := calories
		dp.Calories = &c
	}
	if sleep > 0 {
		sH := sleep
		dp.SleepHours = &sH
	}

	// Persist
	if err := s.store.SaveDataPoint(ctx, &store.WearableData{
		UserID:     dp.UserID,
		Source:     dp.Source,
		Steps:      dp.Steps,
		HeartRate:  sql.NullInt64{Int64: int64(ptrToInt(dp.HeartRate)), Valid: dp.HeartRate != nil},
		SleepHours: sql.NullFloat64{Float64: ptrToFloat(dp.SleepHours), Valid: dp.SleepHours != nil},
		Calories:   sql.NullInt64{Int64: int64(ptrToInt(dp.Calories)), Valid: dp.Calories != nil},
		RecordedAt: dp.RecordedAt,
	}); err != nil {
		return nil, err
	}

	// Return summary
	return []DataPoint{dp}, nil
}

func ptrToInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func ptrToFloat(p *float64) float64 {
	if p == nil {
		return 0
	}
	return *p
}

// GetLatestMetrics returns a compact metrics summary for use by AI and analytics.
func (s *Service) GetLatestMetrics(ctx context.Context, userID int64) (Metrics, error) {
	var m Metrics
	items, err := s.store.ListByUser(ctx, userID)
	if err != nil {
		return m, err
	}
	if len(items) == 0 {
		return m, nil
	}
	// Items are ordered by recorded_at desc in ListByUser
	it := items[0]
	m.Steps = it.Steps
	if it.HeartRate.Valid {
		v := int(it.HeartRate.Int64)
		m.HeartRate = &v
	}
	if it.SleepHours.Valid {
		v := it.SleepHours.Float64
		m.SleepHours = &v
	}
	if it.Calories.Valid {
		v := int(it.Calories.Int64)
		m.Calories = &v
	}
	m.SyncedAt = it.RecordedAt
	return m, nil
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
