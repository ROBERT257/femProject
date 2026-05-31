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

// GET /rehab-plans
func (wh *RehabHandler) HandleListRehabPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := wh.rehabStore.ListRehabPlans()
	if err != nil {
		log.Println("❌ Failed to list rehabilitation plans:", err)
		http.Error(w, "Failed to list rehabilitation plans", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(plans); err != nil {
		log.Println("❌ Failed to encode plans:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
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
		CompletionStatus  string `json:"completion_status"`
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
		PlanID:         rehabPlan.ID,
		PatientName:    rehabPlan.PatientName,
		TherapistName:  rehabPlan.TherapistName,
		Title:          rehabPlan.Title,
		Status:         rehabPlan.Status,
		TotalExercises: len(rehabPlan.Entries),
	}

	var painSum int
	for _, entry := range rehabPlan.Entries {
		item := exerciseProgress{
			Exercise:          entry.Exercise,
			CompletionStatus:  entry.CompletionStatus,
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

// PATCH /rehab-plans/{id}
func (wh *RehabHandler) HandleUpdateRehabPlan(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "Rehabilitation plan ID required", http.StatusBadRequest)
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid rehabilitation plan ID", http.StatusBadRequest)
		return
	}

	// Decode incoming payload into a generic map so we can perform a partial update
	var incoming map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&incoming); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	// Fetch existing plan
	existingPlan, err := wh.rehabStore.GetRehabPlanByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Rehabilitation plan not found", http.StatusNotFound)
			return
		}
		log.Println("❌ Failed to load existing plan:", err)
		http.Error(w, "Failed to load rehabilitation plan", http.StatusInternalServerError)
		return
	}

	// Merge incoming fields into existing plan (partial update semantics)
	if v, ok := incoming["patient_name"].(string); ok {
		existingPlan.PatientName = v
	}
	if v, ok := incoming["patient_id"].(float64); ok {
		existingPlan.PatientID = int64(v)
	}
	if v, ok := incoming["therapist_name"].(string); ok {
		existingPlan.TherapistName = v
	}
	if v, ok := incoming["title"].(string); ok {
		existingPlan.Title = v
	}
	if v, ok := incoming["goal"].(string); ok {
		existingPlan.Goal = v
	}
	if v, ok := incoming["status"].(string); ok {
		existingPlan.Status = v
	}
	if v, ok := incoming["start_date"].(string); ok {
		existingPlan.StartDate = v
	}
	if v, ok := incoming["description"].(string); ok {
		existingPlan.Description = v
	}

	// Ensure the ID is set
	existingPlan.ID = int(id)

	if err := wh.rehabStore.UpdateRehabPlan(existingPlan); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Rehabilitation plan not found", http.StatusNotFound)
		} else {
			log.Println("❌ Failed to update plan:", err)
			http.Error(w, "Failed to update rehabilitation plan", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PATCH /rehab-exercises/{entryID}
func (wh *RehabHandler) HandleUpdateRehabExercise(w http.ResponseWriter, r *http.Request) {
	entryIDStr := chi.URLParam(r, "entryID")
	if entryIDStr == "" {
		http.Error(w, "Exercise ID required", http.StatusBadRequest)
		return
	}

	entryID, err := strconv.ParseInt(entryIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid exercise ID", http.StatusBadRequest)
		return
	}

	var entry store.RehabExercise
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	entry.ID = int(entryID)
	if err := wh.rehabStore.UpdateRehabExercise(&entry); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Rehabilitation exercise not found", http.StatusNotFound)
		} else {
			log.Println("❌ Failed to update exercise:", err)
			http.Error(w, "Failed to update exercise", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
