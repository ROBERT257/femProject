// fem_project/internal/app/store/database.go

package store

import (
	"database/sql"
	"fmt"

	_ "github.com/jackc/pgx/v4/stdlib" // Import pgx driver for database/sql
)

// Open connects to the PostgreSQL database and returns a sql.DB object
func Open() (*sql.DB, error) {
	// Adjust these credentials if needed
	dsn := "host=localhost user=postgres password=postgres dbname=postgres port=5432 sslmode=disable"

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Optional: Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	fmt.Println("✅ Connected to PostgreSQL successfully.")
	return db, nil
}
