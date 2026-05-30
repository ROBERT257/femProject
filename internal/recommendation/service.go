package recommendation

import (
	"context"

	"github.com/ROBERT257/femProject/internal/wearable"
)

// Service coordinates recommendation generation.
type Service struct {
	engine   *Engine
	wearable WearableProvider
}

// WearableProvider returns compact wearable metrics for a user.
type WearableProvider interface {
	GetLatestMetrics(ctx context.Context, userID int64) (wearable.Metrics, error)
}

// NewService creates the recommendation service. wearableProvider is optional.
func NewService(engine *Engine, wearableProvider WearableProvider) *Service {
	return &Service{engine: engine, wearable: wearableProvider}
}

// Generate returns rule-based recommendations for the supplied signals.
func (s *Service) Generate(signals Signals) []string {
	// If a wearable provider is configured and a user ID is available,
	// enrich signals from the latest wearable metrics.
	if s != nil && s.wearable != nil && signals.UserID > 0 {
		if m, err := s.wearable.GetLatestMetrics(context.Background(), signals.UserID); err == nil {
			if signals.SleepHours == 0 && m.SleepHours != nil {
				signals.SleepHours = int(*m.SleepHours + 0.5)
			}
			if signals.HeartRate == 0 && m.HeartRate != nil {
				signals.HeartRate = *m.HeartRate
			}
			// TODO: infer fatigue/workout completed from steps or activity sessions
			if signals.FatigueLevel == 0 && m.Steps < 2000 {
				signals.FatigueLevel = 5 // moderate fatigue inferred
			}
		}
	}

	if s == nil || s.engine == nil {
		return []string{"Continue the current plan and monitor symptoms"}
	}
	return s.engine.Generate(signals)
}
