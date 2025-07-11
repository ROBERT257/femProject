package routes

import (
	appPkg "github.com/ROBERT257/femProject/internal/app"
	"github.com/go-chi/chi"
)

func SetupRoutes(app *appPkg.Application) *chi.Mux {
	r := chi.NewRouter()

	r.Get("/health", app.Healthcheck)
	r.Get("/workout/{id}", app.WorkoutHandler.HandleGetWorkoutByID)
	r.Post("/workouts", app.WorkoutHandler.HandleCreateWorkout)

	return r
}
