package wearable

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi"
)

type syncRequest struct {
	UserID int64       `json:"user_id"`
	Source string      `json:"source"`
	Data   []DataPoint `json:"data"`
}

// Handler exposes wearable endpoints.
type Handler struct {
	service *Service
	logger  *slog.Logger
}

// NewHandler creates a wearable handler.
func NewHandler(service *Service, logger *slog.Logger) *Handler {
	if logger == nil {
		logger = slog.Default()
	}
	return &Handler{service: service, logger: logger}
}

// HandleSync stores a batch of wearable readings.
func (h *Handler) HandleSync(w http.ResponseWriter, r *http.Request) {
	var payload syncRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	if payload.UserID <= 0 {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	items, err := h.service.Sync(r.Context(), payload.UserID, payload.Source, payload.Data)
	if err != nil {
		h.logger.Error("wearable sync failed", "user_id", payload.UserID, "error", err)
		http.Error(w, "failed to sync wearable data", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": items})
}

// HandleList returns wearable data for a user.
func (h *Handler) HandleList(w http.ResponseWriter, r *http.Request) {
	userIDParam := chi.URLParam(r, "userId")
	if userIDParam == "" {
		http.Error(w, "user id required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseInt(userIDParam, 10, 64)
	if err != nil {
		http.Error(w, "invalid user id", http.StatusBadRequest)
		return
	}

	items, err := h.service.List(r.Context(), userID)
	if err != nil {
		h.logger.Error("wearable list failed", "user_id", userID, "error", err)
		http.Error(w, "failed to load wearable data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": items})
}

// HandleGoogleSync triggers a Google Fit sync for a user and returns a summary.
func (h *Handler) HandleGoogleSync(w http.ResponseWriter, r *http.Request) {
	var payload struct{
		UserID int64 `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	if payload.UserID <= 0 {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	items, err := h.service.SyncUserData(r.Context(), payload.UserID)
	if err != nil {
		h.logger.Error("google sync failed", "user_id", payload.UserID, "error", err)
		http.Error(w, "failed to sync google fit", http.StatusBadGateway)
		return
	}
	var resp struct{
		Steps int `json:"steps"`
		HeartRate int `json:"heart_rate"`
		SleepHours float64 `json:"sleep_hours"`
		Calories int `json:"calories"`
		SyncedAt time.Time `json:"synced_at"`
	}
	if len(items) > 0 {
		it := items[0]
		resp.Steps = it.Steps
		if it.HeartRate != nil { resp.HeartRate = *it.HeartRate }
		if it.SleepHours != nil { resp.SleepHours = *it.SleepHours }
		if it.Calories != nil { resp.Calories = *it.Calories }
		resp.SyncedAt = it.RecordedAt
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
