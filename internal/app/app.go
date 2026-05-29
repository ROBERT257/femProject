package app

import (
	"database/sql"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/ROBERT257/femProject/internal/ai"
	"github.com/ROBERT257/femProject/internal/app/api"
	"github.com/ROBERT257/femProject/internal/recommendation"
	"github.com/ROBERT257/femProject/internal/store"
	"github.com/ROBERT257/femProject/internal/wearable"
)

type Application struct {
	Logger                *log.Logger
	StructuredLogger      *slog.Logger
	AIHandler             *ai.Handler
	RecommendationHandler *recommendation.Handler
	WearableHandler       *wearable.Handler
	AccountHandler        *api.AccountHandler
	RehabHandler          *api.RehabHandler
	Healthcheck           http.HandlerFunc
	DB                    *sql.DB
}

// Constructor function that returns a fully initialized Application
func NewApplication() (*Application, error) {
	// 1. Open the PostgreSQL connection
	pgDB, err := store.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to DB: %w", err)
	}

	// 2. Run database migrations (if any)
	err = store.Migrate(pgDB, "migrations") // ✅ make sure 'migrations' folder exists
	if err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	// 3. Setup logger
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)
	aiLogger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	appLogger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	// 4. Initialize the rehab store using the correct constructor
	rehabStore := store.NewRehabStore(pgDB)
	accountStore := store.NewAccountStore(pgDB)
	aiStore := store.NewAIConversationStore(pgDB)
	aiAnalyticsStore := store.NewAIAnalyticsStore(pgDB)
	wearableStore := store.NewWearableStore(pgDB)
	recommendationEngine := &recommendation.Engine{}
	recommendationService := recommendation.NewService(recommendationEngine)
	recommendationHandler := recommendation.NewHandler(recommendationService, appLogger)
	googleFitClient := &wearable.GoogleFitClient{
		ClientID: getenvDefault("GOOGLE_FIT_CLIENT_ID", ""),
		Secret:   getenvDefault("GOOGLE_FIT_CLIENT_SECRET", ""),
	}
	wearableService := wearable.NewService(wearableStore, googleFitClient)
	wearableHandler := wearable.NewHandler(wearableService, appLogger)
	aiClient := ai.NewOllamaClient(
		getenvDefault("OLLAMA_URL", "http://localhost:11434"),
		getenvDefault("OLLAMA_MODEL", "phi3"),
		4*time.Minute,
	)
	aiService := ai.NewService(aiClient, aiStore, aiAnalyticsStore, aiLogger)
	aiHandler := ai.NewHandler(aiService, aiLogger)
	emailSender := api.NewSMTPEmailSenderFromEnv()

	// 5. Create the RehabHandler
	rehabHandler := api.NewRehabHandler(rehabStore)
	accountHandler := api.NewAccountHandler(accountStore, emailSender)

	// 6. Bundle everything into the Application struct
	app := &Application{
		Logger:                logger,
		StructuredLogger:      appLogger,
		AIHandler:             aiHandler,
		RecommendationHandler: recommendationHandler,
		WearableHandler:       wearableHandler,
		AccountHandler:        accountHandler,
		RehabHandler:          rehabHandler,
		Healthcheck:           healthHandler,
		DB:                    pgDB,
	}

	logger.Println("✅ Connected to database")
	return app, nil
}

// Healthcheck endpoint (GET /health)
func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "My name is ROBERT. I am a Go developer, and I am learning how to build a web application with Go!")
}

func getenvDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
