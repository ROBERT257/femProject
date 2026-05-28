package routes

import (
	"net/http"

	appPkg "github.com/ROBERT257/femProject/internal/app"
	"github.com/go-chi/chi"
)

func SetupRoutes(app *appPkg.Application) *chi.Mux {
	r := chi.NewRouter()
	r.Use(corsMiddleware)

	r.Get("/health", app.Healthcheck)
	r.Get("/accounts", app.AccountHandler.HandleListAccounts)
	r.Post("/admin/therapists", app.AccountHandler.HandleCreateTherapist)
	r.Post("/auth/login", app.AccountHandler.HandleLogin)
	r.Post("/therapists/{therapistID}/password-reset", app.AccountHandler.HandleResetTherapistPassword)
	r.Post("/therapists/{therapistID}/patients", app.AccountHandler.HandleCreatePatient)
	r.Get("/therapists/{therapistID}/patients", app.AccountHandler.HandleListPatientsByTherapist)

	// Rehabilitation plan routes
	// Rehabilitation plan routes
	r.Get("/rehab-plans", app.RehabHandler.HandleListRehabPlans)
	r.Post("/rehab-plans", app.RehabHandler.HandleCreateRehabPlan)
	r.Patch("/rehab-plans/{id}", app.RehabHandler.HandleUpdateRehabPlan)
	r.Get("/rehab-plans/{id}", app.RehabHandler.HandleGetRehabPlanByID)
	r.Get("/rehab-plans/{id}/progress", app.RehabHandler.HandleGetRehabProgress)
	r.Delete("/rehab-plans/{id}", app.RehabHandler.HandleDeleteRehabPlanByID)

	// Individual rehabilitation exercise routes
	r.Patch("/rehab-exercises/{entryID}", app.RehabHandler.HandleUpdateRehabExercise)
	r.Delete("/rehab-exercises/{entryID}", app.RehabHandler.HandleDeleteRehabExerciseByID)

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
