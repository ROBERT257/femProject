package ai

import (
	"fmt"
	"strings"
)

const systemRehabPrompt = "You are a rehabilitation and fitness AI assistant. Return ONLY valid JSON in this format: {\"response\":\"short rehab guidance\",\"recommendations\":[\"recommendation 1\",\"recommendation 2\"],\"risk_level\":\"low | medium | high\"}."

// BuildRehabPrompt formats the user message into a rehabilitation-focused prompt.
func BuildRehabPrompt(userMessage string) string {
	return fmt.Sprintf("%s\n\nUser message:\n%s", systemRehabPrompt, userMessage)
}

// AssessRiskLevel uses simple clinical guardrails to classify the message.
func AssessRiskLevel(userMessage string) string {
	message := strings.ToLower(userMessage)
	switch {
	case strings.Contains(message, "chest pain"), strings.Contains(message, "shortness of breath"), strings.Contains(message, "numb"), strings.Contains(message, "faint"):
		return "high"
	case strings.Contains(message, "swelling"), strings.Contains(message, "sharp pain"), strings.Contains(message, "severe pain"), strings.Contains(message, "instability"):
		return "medium"
	default:
		return "low"
	}
}

// BuildRecommendations returns short actionable suggestions for common rehab scenarios.
func BuildRecommendations(userMessage string) []string {
	message := strings.ToLower(userMessage)
	recommendations := make([]string, 0, 3)

	if strings.Contains(message, "pain") {
		recommendations = append(recommendations, "Reduce intensity and avoid painful ranges")
	}
	if strings.Contains(message, "squat") || strings.Contains(message, "knee") {
		recommendations = append(recommendations, "Check squat depth, knee tracking, and load")
	}
	if strings.Contains(message, "swelling") || strings.Contains(message, "sore") {
		recommendations = append(recommendations, "Use recovery-focused mobility and rest between sessions")
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Monitor symptoms and keep the next session lighter if discomfort persists")
	}

	return recommendations
}
