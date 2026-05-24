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

type WorkoutHandler struct {
	workoutStore store.WorkoutStore
}

// Constructor
func NewWorkoutHandler(workoutStore store.WorkoutStore) *WorkoutHandler {
	return &WorkoutHandler{
		workoutStore: workoutStore,
	}
}

// POST /workouts
func (wh *WorkoutHandler) HandleCreateWorkout(w http.ResponseWriter, r *http.Request) {
	fmt.Println("✅ HandleCreateWorkout called")

	var workout store.Workout
	err := json.NewDecoder(r.Body).Decode(&workout)
	if err != nil {
		log.Println("❌ JSON decode error:", err)
		http.Error(w, "Invalid workout payload", http.StatusBadRequest)
		return
	}

	fmt.Printf("📦 Incoming workout: %+v\n", workout)

	createdWorkout, err := wh.workoutStore.CreateWorkout(&workout)
	if err != nil {
		log.Println("❌ Workout creation error:", err)
		http.Error(w, "Failed to create workout", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(createdWorkout)
	if err != nil {
		log.Println("❌ JSON encode error:", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}

	fmt.Println("✅ Workout saved and returned")
}

// GET /workouts/{id}
func (wh *WorkoutHandler) HandleGetWorkoutByID(w http.ResponseWriter, r *http.Request) {
	workoutIDParam := chi.URLParam(r, "id")
	if workoutIDParam == "" {
		http.Error(w, "Workout ID required", http.StatusBadRequest)
		return
	}

	workoutID, err := strconv.ParseInt(workoutIDParam, 10, 64)
	if err != nil {
		log.Println("❌ Invalid workout ID:", err)
		http.Error(w, "Invalid workout ID", http.StatusBadRequest)
		return
	}

	workout, err := wh.workoutStore.GetWorkoutByID(workoutID)
	if err != nil {
		log.Println("❌ Failed to fetch workout:", err)
		http.Error(w, "Workout not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(workout)
	if err != nil {
		log.Println("❌ Failed to encode workout:", err)
		http.Error(w, "Failed to return workout", http.StatusInternalServerError)
		return
	}
}

// DELETE /workouts/{workoutID}
func (wh *WorkoutHandler) HandleDeleteWorkoutByID(w http.ResponseWriter, r *http.Request) {
	workoutIDStr := chi.URLParam(r, "workoutID")
	workoutID, err := strconv.Atoi(workoutIDStr)
	if err != nil {
		http.Error(w, "Invalid workout ID", http.StatusBadRequest)
		return
	}

	err = wh.workoutStore.DeleteWorkout(int64(workoutID))
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Workout not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete workout", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DELETE /workout-entries/{entryID}
func (wh *WorkoutHandler) HandleDeleteWorkoutEntryByID(w http.ResponseWriter, r *http.Request) {
	entryIDStr := chi.URLParam(r, "entryID")
	entryID, err := strconv.Atoi(entryIDStr)
	if err != nil {
		http.Error(w, "Invalid entry ID", http.StatusBadRequest)
		return
	}

	err = wh.workoutStore.DeleteWorkoutEntryByID(int64(entryID))
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Workout entry not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete workout entry", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
