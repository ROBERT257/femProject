// fem_project/internal/app/store/database.go
package store

import (
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"strings"

	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/pressly/goose/v3"
)

// Open connects to the PostgreSQL database and returns a sql.DB object.
func Open() (*sql.DB, error) {
	dsn := buildDSNFromEnv()

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	fmt.Println("✅ Connected to PostgreSQL successfully.")
	return db, nil
}

func buildDSNFromEnv() string {
	if dsn := strings.TrimSpace(os.Getenv("DB_URL")); dsn != "" {
		return dsn
	}

	parts := []string{
		"host=" + getenvDefault("DB_HOST", "localhost"),
		"port=" + getenvDefault("DB_PORT", "5432"),
		"user=" + getenvDefault("DB_USER", "postgres"),
		"password=" + getenvDefault("DB_PASSWORD", "postgres"),
		"dbname=" + getenvDefault("DB_NAME", "postgres"),
		"sslmode=" + getenvDefault("DB_SSLMODE", "disable"),
	}
	return strings.Join(parts, " ")
}

func getenvDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func MigrateFS(db *sql.DB, migrationsFS fs.FS, dir string) error {
	goose.SetBaseFS(migrationsFS)
	defer func() {
		goose.SetBaseFS(nil)
	}()
	return Migrate(db, dir)
}

func Migrate(db *sql.DB, dir string) error {
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("migrate %w", err)
	}
	if err := goose.Up(db, dir); err != nil {
		return fmt.Errorf("goose up %w", err)
	}
	return nil
}
