package routes

import (
	appPkg "github.com/ROBERT257/femProject/internal/app"
	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
)

func SetupRoutes(app *appPkg.Application) *chi.Mux {
	r := chi.NewRouter()

	// Enable CORS for all origins in development
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", app.Healthcheck)

	// Workout routes
	r.Post("/workouts", app.WorkoutHandler.HandleCreateWorkout)
	r.Get("/workouts/{id}", app.WorkoutHandler.HandleGetWorkoutByID)
	r.Delete("/workouts/{id}", app.WorkoutHandler.HandleDeleteWorkoutByID)

	// Optional: Delete individual workout entry by ID
	// r.Delete("/workout-entries/{entryID}", app.WorkoutHandler.HandleDeleteWorkoutEntryByID)

	return r
}
