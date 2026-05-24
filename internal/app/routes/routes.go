package routes

import (
	appPkg "github.com/ROBERT257/femProject/internal/app"
	"github.com/go-chi/chi"
)

func SetupRoutes(app *appPkg.Application) *chi.Mux {
	r := chi.NewRouter()

	r.Get("/health", app.Healthcheck)

	// Rehabilitation plan routes
	// Rehabilitation plan routes
	r.Post("/rehab-plans", app.RehabHandler.HandleCreateRehabPlan)
	r.Get("/rehab-plans/{id}", app.RehabHandler.HandleGetRehabPlanByID)
	r.Get("/rehab-plans/{id}/progress", app.RehabHandler.HandleGetRehabProgress)
	r.Delete("/rehab-plans/{id}", app.RehabHandler.HandleDeleteRehabPlanByID)

	// Optional: Delete individual rehabilitation exercise by ID
	// r.Delete("/rehab-exercises/{entryID}", app.WorkoutHandler.HandleDeleteWorkoutEntryByID)

	return r
}
