package analytics

// RecoveryScore estimates patient recovery readiness on a 0-100 scale.
func RecoveryScore(painLevel, sleepHours, fatigueLevel int) int {
	score := 100

	if painLevel > 0 {
		score -= painLevel * 6
	}
	if sleepHours < 8 {
		score -= (8 - sleepHours) * 5
	}
	if fatigueLevel > 0 {
		score -= fatigueLevel * 5
	}

	if score < 0 {
		return 0
	}
	if score > 100 {
		return 100
	}
	return score
}

// WorkoutAdherence returns the completion ratio as a percentage.
func WorkoutAdherence(completed, total int) float64 {
	if total <= 0 {
		return 0
	}
	if completed < 0 {
		completed = 0
	}
	if completed > total {
		completed = total
	}
	return float64(completed) / float64(total) * 100
}
