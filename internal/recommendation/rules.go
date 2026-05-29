package recommendation

// Rule describes one explicit recommendation rule.
type Rule struct {
	Name        string
	Description string
	MinPain     int
	MinFatigue  int
	MaxSleep    int
	Apply       func(Signals) bool
	Result      string
}

// DefaultRules documents the business logic used by the engine.
func DefaultRules() []Rule {
	return []Rule{
		{
			Name:        "high_pain",
			Description: "High pain should lower intensity.",
			MinPain:     7,
			Result:      "Reduce workout intensity",
			Apply: func(s Signals) bool {
				return s.PainLevel >= 7
			},
		},
		{
			Name:        "poor_sleep",
			Description: "Poor sleep should bias toward recovery work.",
			MaxSleep:    5,
			Result:      "Focus on recovery work",
			Apply: func(s Signals) bool {
				return s.SleepHours > 0 && s.SleepHours < 6
			},
		},
		{
			Name:        "missed_workout",
			Description: "Missed sessions should shorten the next workout.",
			Result:      "Use a shorter session",
			Apply: func(s Signals) bool {
				return s.WorkoutCompleted != nil && !*s.WorkoutCompleted
			},
		},
		{
			Name:        "high_fatigue",
			Description: "High fatigue should shift the session to mobility.",
			MinFatigue:  7,
			Result:      "Prioritize mobility and low-load movement",
			Apply: func(s Signals) bool {
				return s.FatigueLevel >= 7
			},
		},
	}
}
