package recommendation

import "strings"

// Signals are the inputs used by the rule engine.
type Signals struct {
	PainLevel       int   `json:"pain_level"`
	SleepHours      int   `json:"sleep_hours"`
	WorkoutCompleted *bool `json:"workout_completed,omitempty"`
	FatigueLevel    int   `json:"fatigue_level"`
	HeartRate       int   `json:"heart_rate"`
	UserID          int64 `json:"user_id,omitempty"`
}

// Engine evaluates patient signals and produces recommendations.
type Engine struct{}

// Generate returns a deterministic recommendation set for the provided signals.
func (e *Engine) Generate(signals Signals) []string {
	recommendations := make([]string, 0, 4)

	if signals.PainLevel >= 7 {
		recommendations = append(recommendations, "Reduce workout intensity")
	}
	if signals.SleepHours > 0 && signals.SleepHours < 6 {
		recommendations = append(recommendations, "Focus on recovery work")
	}
	if signals.WorkoutCompleted != nil && !*signals.WorkoutCompleted {
		recommendations = append(recommendations, "Use a shorter session")
	}
	if signals.FatigueLevel >= 7 {
		recommendations = append(recommendations, "Prioritize mobility and low-load movement")
	}
	if signals.HeartRate > 0 && signals.HeartRate >= 120 {
		recommendations = append(recommendations, "Keep intensity lower until heart rate settles")
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Continue the current plan and monitor symptoms")
	}

	return uniqueStrings(recommendations)
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	out := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, ok := seen[trimmed]; ok {
			continue
		}
		seen[trimmed] = struct{}{}
		out = append(out, trimmed)
	}
	return out
}
