package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/ROBERT257/femProject/internal/wearable"
	"github.com/ROBERT257/femProject/internal/store"
)

// ConversationStore persists AI conversations.
type ConversationStore interface {
	SaveConversation(ctx context.Context, userID int64, userMessage, aiResponse string) error
}

// AnalyticsStore persists AI request telemetry.
type AnalyticsStore interface {
	SaveRequestAnalytics(ctx context.Context, input store.RequestAnalytics) error
}

// Service coordinates prompt creation, model calls, and persistence.
type Service struct {
	client    *OllamaClient
	store     ConversationStore
	analytics AnalyticsStore
	logger    *slog.Logger
	wearable  WearableProvider
}

// WearableProvider returns compact wearable metrics for a user.
type WearableProvider interface {
	GetLatestMetrics(ctx context.Context, userID int64) (wearable.Metrics, error)
}

// NewService creates the AI service. The wearable provider is optional (pass nil to skip wearable context).
func NewService(client *OllamaClient, store ConversationStore, analytics AnalyticsStore, logger *slog.Logger, wearableProvider WearableProvider) *Service {
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{client: client, store: store, analytics: analytics, logger: logger, wearable: wearableProvider}
}

// Chat generates a rehab-safe response and persists the exchange.
func (s *Service) Chat(ctx context.Context, userID int64, message string) (*ChatResult, error) {
	message = strings.TrimSpace(message)
	if message == "" {
		return nil, fmt.Errorf("message is required")
	}

	// Build base prompt and optionally append wearable metrics if available
	prompt := ""
	if s.wearable != nil {
		if metrics, err := s.wearable.GetLatestMetrics(ctx, userID); err == nil {
			// Only include wearable context if any metric present
			if metrics.Steps > 0 || metrics.HeartRate != nil || metrics.SleepHours != nil || metrics.Calories != nil {
				wearableCtx := "User wearable metrics:\n"
				wearableCtx += fmt.Sprintf("- Steps: %d\n", metrics.Steps)
				if metrics.SleepHours != nil {
					wearableCtx += fmt.Sprintf("- Sleep: %.1f hours\n", *metrics.SleepHours)
				}
				if metrics.HeartRate != nil {
					wearableCtx += fmt.Sprintf("- Resting HR: %d\n", *metrics.HeartRate)
				}
				if metrics.Calories != nil {
					wearableCtx += fmt.Sprintf("- Calories: %d\n", *metrics.Calories)
				}
				prompt = fmt.Sprintf("%s\n\n%s\nUser message:\n%s", systemRehabPrompt, wearableCtx, message)
			} else {
				prompt = BuildRehabPrompt(message)
			}
		} else {
			// On error fetching wearable metrics, proceed without them
			prompt = BuildRehabPrompt(message)
		}
	} else {
		prompt = BuildRehabPrompt(message)
	}
	startedAt := time.Now()
	generation, err := s.client.Generate(ctx, prompt)
	if err != nil {
		s.logger.Error("ollama generation failed", "user_id", userID, "error", err)
		return nil, err
	}

	aiResponse, err := parseAIResponse(generation.Response)
	if err != nil {
		return nil, fmt.Errorf("parse ai response: %w", err)
	}
	if aiResponse.RiskLevel == "" {
		aiResponse.RiskLevel = AssessRiskLevel(message)
	}
	if len(aiResponse.Recommendations) == 0 {
		aiResponse.Recommendations = BuildRecommendations(message)
	}

	responseJSON, err := json.Marshal(aiResponse)
	if err != nil {
		return nil, fmt.Errorf("marshal ai response: %w", err)
	}

	if err := s.store.SaveConversation(ctx, userID, message, string(responseJSON)); err != nil {
		s.logger.Error("failed to persist ai conversation", "user_id", userID, "error", err)
		return nil, err
	}

	if s.analytics != nil {
		_ = s.analytics.SaveRequestAnalytics(ctx, store.RequestAnalytics{
			UserID:               userID,
			RequestType:          "ai_chat",
			ModelUsed:            generation.Model,
			PromptDuration:       time.Since(startedAt).Milliseconds(),
			TokenCount:           generation.TotalTokens,
			PromptTokenCount:     generation.PromptTokens,
			CompletionTokenCount: generation.CompletionTokens,
		})
	}

	result := &ChatResult{
		Response:        aiResponse.Response,
		Recommendations: aiResponse.Recommendations,
		RiskLevel:       aiResponse.RiskLevel,
	}

	s.logger.Info("ai chat completed", "user_id", userID, "risk_level", result.RiskLevel)
	return result, nil
}

func parseAIResponse(raw string) (AIResponse, error) {
	var aiResponse AIResponse
	if err := json.Unmarshal([]byte(raw), &aiResponse); err == nil {
		return aiResponse, nil
	}

	start := strings.Index(raw, "{")
	end := strings.LastIndex(raw, "}")
	if start >= 0 && end > start {
		if err := json.Unmarshal([]byte(raw[start:end+1]), &aiResponse); err == nil {
			return aiResponse, nil
		}
	}

	return AIResponse{}, fmt.Errorf("unexpected ai json: %s", raw)
}
