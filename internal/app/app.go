package app

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/ROBERT257/femProject/internal/app/api"
	"github.com/ROBERT257/femProject/internal/store"
)

type Application struct {
	Logger         *log.Logger
	AccountHandler *api.AccountHandler
	RehabHandler   *api.RehabHandler
	Healthcheck    http.HandlerFunc
	DB             *sql.DB
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

	// 4. Initialize the rehab store using the correct constructor
	rehabStore := store.NewRehabStore(pgDB)
	accountStore := store.NewAccountStore(pgDB)
	emailSender := api.NewSMTPEmailSenderFromEnv()

	// 5. Create the RehabHandler
	rehabHandler := api.NewRehabHandler(rehabStore)
	accountHandler := api.NewAccountHandler(accountStore, emailSender)

	// 6. Bundle everything into the Application struct
	app := &Application{
		Logger:         logger,
		AccountHandler: accountHandler,
		RehabHandler:   rehabHandler,
		Healthcheck:    healthHandler,
		DB:             pgDB,
	}

	logger.Println("✅ Connected to database")
	return app, nil
}

// Healthcheck endpoint (GET /health)
func healthHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "My name is ROBERT. I am a Go developer, and I am learning how to build a web application with Go!")
}
