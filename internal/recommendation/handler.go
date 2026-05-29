package recommendation

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// Handler exposes recommendation endpoints.
type Handler struct {
	service *Service
	logger  *slog.Logger
}

// NewHandler creates a recommendation handler.
func NewHandler(service *Service, logger *slog.Logger) *Handler {
	if logger == nil {
		logger = slog.Default()
	}
	return &Handler{service: service, logger: logger}
}

// HandleGenerate serves POST /api/recommendations/generate.
func (h *Handler) HandleGenerate(w http.ResponseWriter, r *http.Request) {
	var signals Signals
	if err := json.NewDecoder(r.Body).Decode(&signals); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	recommendations := h.service.Generate(signals)
	h.logger.Info("recommendations generated", "pain_level", signals.PainLevel, "sleep_hours", signals.SleepHours, "fatigue_level", signals.FatigueLevel)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"recommendations": recommendations})
}
