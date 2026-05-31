package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ROBERT257/femProject/internal/store"
)

type AnalyticsHandler struct {
	rehabStore store.RehabStore
}

func NewAnalyticsHandler(rehabStore store.RehabStore) *AnalyticsHandler {
	return &AnalyticsHandler{rehabStore: rehabStore}
}

// GET /api/analytics/snapshot?days=7
func (ah *AnalyticsHandler) HandleSnapshot(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	days := 7
	var patientID *int64
	if v := q.Get("days"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			days = n
		}
	}

	if v := q.Get("patient_id"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			patientID = &n
		}
	}

	pts, err := ah.rehabStore.AnalyticsSnapshot(days, patientID)
	if err != nil {
		http.Error(w, "Failed to compute analytics", http.StatusInternalServerError)
		return
	}

	resp := map[string]interface{}{"painTrend": pts}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
