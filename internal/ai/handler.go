package ai

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type chatRequest struct {
	UserID  int64  `json:"user_id"`
	Message string `json:"message"`
}

// Handler exposes AI HTTP endpoints.
type Handler struct {
	service *Service
	logger  *slog.Logger
}

// NewHandler creates a new AI handler.
func NewHandler(service *Service, logger *slog.Logger) *Handler {
	if logger == nil {
		logger = slog.Default()
	}
	return &Handler{service: service, logger: logger}
}

// HandleChat serves POST /api/ai/chat.
func (h *Handler) HandleChat(w http.ResponseWriter, r *http.Request) {
	var payload chatRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	if payload.UserID <= 0 {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}
	payload.Message = strings.TrimSpace(payload.Message)
	if payload.Message == "" {
		http.Error(w, "message is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Minute)
	defer cancel()

	result, err := h.service.Chat(ctx, payload.UserID, payload.Message)
	if err != nil {
		h.logger.Error("ai chat failed", "user_id", payload.UserID, "error", err)
		http.Error(w, "failed to process ai chat", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}
