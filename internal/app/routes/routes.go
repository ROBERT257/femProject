package routes

import (
	appPkg "github.com/ROBERT257/femProject/internal/app"
	"github.com/go-chi/chi"
)

func SetupRoutes(app *appPkg.Application) *chi.Mux {
	r := chi.NewRouter()

	r.Get("/health", app.Healthcheck)

	// Workout routes
	r.Post("/workouts", app.WorkoutHandler.HandleCreateWorkout)
	r.Get("/workouts/{id}", app.WorkoutHandler.HandleGetWorkoutByID)
	r.Delete("/workouts/{id}", app.WorkoutHandler.HandleDeleteWorkoutByID)

	// Optional: Delete individual workout entry by ID
	// r.Delete("/workout-entries/{entryID}", app.WorkoutHandler.HandleDeleteWorkoutEntryByID)

	return r
}
