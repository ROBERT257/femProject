package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/ROBERT257/femProject/internal/store"
	"github.com/go-chi/chi"
)

type RehabHandler struct {
	rehabStore store.RehabStore
}

// Constructor
func NewRehabHandler(rehabStore store.RehabStore) *RehabHandler {
	return &RehabHandler{
		rehabStore: rehabStore,
	}
}

// POST /rehab-plans
func (wh *RehabHandler) HandleCreateRehabPlan(w http.ResponseWriter, r *http.Request) {
	fmt.Println("✅ HandleCreateRehabPlan called")

	var rehabPlan store.RehabPlan
	err := json.NewDecoder(r.Body).Decode(&rehabPlan)
	if err != nil {
		log.Println("❌ JSON decode error:", err)
		http.Error(w, "Invalid rehabilitation payload", http.StatusBadRequest)
		return
	}

	fmt.Printf("📦 Incoming rehabilitation plan: %+v\n", rehabPlan)

	createdRehabPlan, err := wh.rehabStore.CreateRehabPlan(&rehabPlan)
	if err != nil {
		log.Println("❌ Rehabilitation creation error:", err)
		http.Error(w, "Failed to create rehabilitation plan", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(createdRehabPlan)
	if err != nil {
		log.Println("❌ JSON encode error:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

	fmt.Println("✅ Rehabilitation plan saved and returned")
}

// GET /rehab-plans/{id}
func (wh *RehabHandler) HandleGetRehabPlanByID(w http.ResponseWriter, r *http.Request) {
	rehabPlanIDParam := chi.URLParam(r, "id")
	if rehabPlanIDParam == "" {
		http.Error(w, "Rehabilitation plan ID required", http.StatusBadRequest)
		return
	}

	rehabPlanID, err := strconv.ParseInt(rehabPlanIDParam, 10, 64)
	if err != nil {
		log.Println("❌ Invalid rehabilitation plan ID:", err)
		http.Error(w, "Invalid rehabilitation plan ID", http.StatusBadRequest)
		return
	}

	rehabPlan, err := wh.rehabStore.GetRehabPlanByID(rehabPlanID)
	if err != nil {
		log.Println("❌ Failed to fetch rehabilitation plan:", err)
		http.Error(w, "Rehabilitation plan not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(rehabPlan)
	if err != nil {
		log.Println("❌ Failed to encode rehabilitation plan:", err)
		http.Error(w, "Failed to return rehabilitation plan", http.StatusInternalServerError)
		return
	}
}

// DELETE /rehab-plans/{id}
func (wh *RehabHandler) HandleDeleteRehabPlanByID(w http.ResponseWriter, r *http.Request) {
	rehabPlanIDStr := chi.URLParam(r, "id")
	rehabPlanID, err := strconv.Atoi(rehabPlanIDStr)
	if err != nil {
		http.Error(w, "Invalid rehabilitation plan ID", http.StatusBadRequest)
		return
	}

	err = wh.rehabStore.DeleteRehabPlan(int64(rehabPlanID))
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Rehabilitation plan not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete rehabilitation plan", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DELETE /rehab-exercises/{entryID}
func (wh *RehabHandler) HandleDeleteRehabExerciseByID(w http.ResponseWriter, r *http.Request) {
	entryIDStr := chi.URLParam(r, "entryID")
	entryID, err := strconv.Atoi(entryIDStr)
	if err != nil {
		http.Error(w, "Invalid exercise ID", http.StatusBadRequest)
		return
	}

	err = wh.rehabStore.DeleteRehabExerciseByID(int64(entryID))
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Rehabilitation exercise not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete rehabilitation exercise", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GET /rehab-plans/{id}/progress
func (wh *RehabHandler) HandleGetRehabProgress(w http.ResponseWriter, r *http.Request) {
	rehabPlanIDParam := chi.URLParam(r, "id")
	if rehabPlanIDParam == "" {
		http.Error(w, "Rehabilitation plan ID required", http.StatusBadRequest)
		return
	}

	rehabPlanID, err := strconv.ParseInt(rehabPlanIDParam, 10, 64)
	if err != nil {
		http.Error(w, "Invalid rehabilitation plan ID", http.StatusBadRequest)
		return
	}

	rehabPlan, err := wh.rehabStore.GetRehabPlanByID(rehabPlanID)
	if err != nil {
		http.Error(w, "Rehabilitation plan not found", http.StatusNotFound)
		return
	}

	type exerciseProgress struct {
		Exercise          string `json:"exercise"`
		CompletionStatus   string `json:"completion_status"`
		PainLevel         int    `json:"pain_level"`
		PatientNotes      string `json:"patient_notes"`
		TherapistComments string `json:"therapist_comments"`
	}

	progress := struct {
		PlanID             int                `json:"plan_id"`
		PatientName        string             `json:"patient_name"`
		TherapistName      string             `json:"therapist_name"`
		Title              string             `json:"title"`
		Status             string             `json:"status"`
		TotalExercises     int                `json:"total_exercises"`
		CompletedExercises int                `json:"completed_exercises"`
		SkippedExercises   int                `json:"skipped_exercises"`
		PendingExercises   int                `json:"pending_exercises"`
		AveragePainLevel   float64            `json:"average_pain_level"`
		Exercises          []exerciseProgress `json:"exercises"`
	}{
		PlanID:        rehabPlan.ID,
		PatientName:   rehabPlan.PatientName,
		TherapistName: rehabPlan.TherapistName,
		Title:         rehabPlan.Title,
		Status:        rehabPlan.Status,
		TotalExercises: len(rehabPlan.Entries),
	}

	var painSum int
	for _, entry := range rehabPlan.Entries {
		item := exerciseProgress{
			Exercise:          entry.Exercise,
			CompletionStatus:   entry.CompletionStatus,
			PainLevel:         entry.PainLevel,
			PatientNotes:      entry.PatientNotes,
			TherapistComments: entry.TherapistComments,
		}
		progress.Exercises = append(progress.Exercises, item)
		painSum += entry.PainLevel

		switch entry.CompletionStatus {
		case "completed":
			progress.CompletedExercises++
		case "skipped":
			progress.SkippedExercises++
		default:
			progress.PendingExercises++
		}
	}

	if progress.TotalExercises > 0 {
		progress.AveragePainLevel = float64(painSum) / float64(progress.TotalExercises)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(progress); err != nil {
		http.Error(w, "Failed to return rehabilitation progress", http.StatusInternalServerError)
		return
	}
}