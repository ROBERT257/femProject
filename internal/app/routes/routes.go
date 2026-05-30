package routes

import (
	"net/http"

	appPkg "github.com/ROBERT257/femProject/internal/app"
	appmiddleware "github.com/ROBERT257/femProject/internal/middleware"
	"github.com/go-chi/chi"
)

func SetupRoutes(app *appPkg.Application) *chi.Mux {
	r := chi.NewRouter()
	r.Use(appmiddleware.Recovery)
	r.Use(corsMiddleware)

	r.Get("/health", app.Healthcheck)
	r.Get("/accounts", app.AccountHandler.HandleListAccounts)
	r.Post("/admin/therapists", app.AccountHandler.HandleCreateTherapist)
	r.Post("/auth/login", app.AccountHandler.HandleLogin)
	r.Post("/therapists/{therapistID}/password-reset", app.AccountHandler.HandleResetTherapistPassword)
	r.Post("/therapists/{therapistID}/patients", app.AccountHandler.HandleCreatePatient)
	r.Get("/therapists/{therapistID}/patients", app.AccountHandler.HandleListPatientsByTherapist)
	r.Post("/api/ai/chat", app.AIHandler.HandleChat)
	r.Post("/api/recommendations/generate", app.RecommendationHandler.HandleGenerate)
	r.Post("/api/wearables/sync", app.WearableHandler.HandleSync)
	r.Get("/api/wearables/{userId}", app.WearableHandler.HandleList)
    // Google Fit OAuth endpoints
    r.Get("/api/wearables/google/login", app.WearableHandler.HandleGoogleLogin)
    r.Get("/api/wearables/google/callback", app.WearableHandler.HandleGoogleCallback)
	r.Post("/api/wearables/google/sync", app.WearableHandler.HandleGoogleSync)

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
