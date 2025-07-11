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

	// 2. Setup logger
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	// 3. Create the WorkoutHandler
	workoutHandler := api.NewWorkoutHandler()

	// 4. Bundle everything into the Application struct
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
	fmt.Fprint(w, "my name is ROBERT, I AM A GO DEVELOPER, AND I AM LEARNING HOW TO BUILD A WEB APPLICATION WITH GO!")
}
