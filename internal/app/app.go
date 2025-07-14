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
	WorkoutHandler *api.WorkoutHandler
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

	// ✅ 4. Initialize WorkoutStore using the correct constructor
	workoutStore := store.NewWorkoutStore(pgDB)

	// 5. Create the WorkoutHandler
	workoutHandler := api.NewWorkoutHandler(workoutStore)

	// 6. Bundle everything into the Application struct
	app := &Application{
		Logger:         logger,
		WorkoutHandler: workoutHandler,
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
