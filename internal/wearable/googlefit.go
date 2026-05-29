package wearable

import "context"

// GoogleFitClient is a placeholder for future Google Fit integration.
type GoogleFitClient struct {
	ClientID string
	Secret   string
}

// SyncUserData returns placeholder data for now.
func (c *GoogleFitClient) SyncUserData(ctx context.Context, userID int64) ([]DataPoint, error) {
	return []DataPoint{}, nil
}
