package store

import (
	"database/sql"
	"errors"
)

// Workout represents a workout session.
type Workout struct {
	ID              int            `json:"id"`
	Title           string         `json:"title"`
	Description     string         `json:"description"`
	DurationMinutes int            `json:"duration_minutes"`
	CaloriesBurned  int            `json:"calories_burned"`
	Entries         []WorkoutEntry `json:"entries"`
}

// WorkoutEntry represents an individual exercise in a workout.
type WorkoutEntry struct {
	ID              int      `json:"id"`
	Exercise        string   `json:"exercise"`
	Sets            int      `json:"sets"`
	Reps            *int     `json:"reps"`
	DurationSeconds *int     `json:"duration_seconds"`
	Weight          *float64 `json:"weight"`
	Notes           string   `json:"notes"`
	OrderIndex      int      `json:"order_index"`
}

// WorkoutStore defines methods to interact with the workout data.
type WorkoutStore interface {
	CreateWorkout(*Workout) (*Workout, error)
	GetWorkoutByID(int64) (*Workout, error)
	UpdateWorkout(*Workout) error
	DeleteWorkout(int64) error
	UpdateWorkoutEntry(*WorkoutEntry) error
	DeleteWorkoutEntryByID(int64) error // ✅ Added method to interface
}

// PostgresWorkoutStore implements the WorkoutStore interface using PostgreSQL.
type PostgresWorkoutStore struct {
	db *sql.DB
}

// NewWorkoutStore creates a new instance of PostgresWorkoutStore.
func NewWorkoutStore(db *sql.DB) *PostgresWorkoutStore {
	return &PostgresWorkoutStore{db: db}
}

// CreateWorkout inserts a new workout and its entries into the database.
func (pg *PostgresWorkoutStore) CreateWorkout(workout *Workout) (*Workout, error) {
	tx, err := pg.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := `INSERT INTO workouts (title, description, duration_minutes, calories_burned)
			  VALUES ($1, $2, $3, $4) RETURNING id`
	var workoutID int
	err = tx.QueryRow(query, workout.Title, workout.Description, workout.DurationMinutes, workout.CaloriesBurned).Scan(&workoutID)
	if err != nil {
		return nil, err
	}

	for i, entry := range workout.Entries {
		query = `INSERT INTO workout_entries (workout_id, exercise, sets, reps, duration_seconds, weight, notes, order_index)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				 RETURNING id`
		err = tx.QueryRow(query, workoutID, entry.Exercise, entry.Sets, entry.Reps, entry.DurationSeconds, entry.Weight, entry.Notes, entry.OrderIndex).Scan(&entry.ID)
		if err != nil {
			return nil, err
		}
		workout.Entries[i].ID = entry.ID
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	workout.ID = workoutID
	return workout, nil
}

// GetWorkoutByID fetches a workout and its entries by ID.
func (pg *PostgresWorkoutStore) GetWorkoutByID(workoutID int64) (*Workout, error) {
	workout := &Workout{}
	query := `SELECT id, title, description, duration_minutes, calories_burned
              FROM workouts WHERE id = $1`
	err := pg.db.QueryRow(query, workoutID).Scan(&workout.ID, &workout.Title, &workout.Description, &workout.DurationMinutes, &workout.CaloriesBurned)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, err
	}

	entriesQuery := `SELECT id, exercise, sets, reps, duration_seconds, weight, notes, order_index
					 FROM workout_entries
					 WHERE workout_id = $1
					 ORDER BY order_index`

	rows, err := pg.db.Query(entriesQuery, workoutID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var entry WorkoutEntry
		err := rows.Scan(&entry.ID, &entry.Exercise, &entry.Sets, &entry.Reps, &entry.DurationSeconds, &entry.Weight, &entry.Notes, &entry.OrderIndex)
		if err != nil {
			return nil, err
		}
		workout.Entries = append(workout.Entries, entry)
	}

	return workout, nil
}

// UpdateWorkout updates an existing workout's main details.
func (pg *PostgresWorkoutStore) UpdateWorkout(workout *Workout) error {
	query := `UPDATE workouts 
			  SET title = $1, description = $2, duration_minutes = $3, calories_burned = $4
			  WHERE id = $5`

	result, err := pg.db.Exec(query, workout.Title, workout.Description, workout.DurationMinutes, workout.CaloriesBurned, workout.ID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("no workout found to update")
	}

	return nil
}

// UpdateWorkoutEntry updates an individual workout entry by ID.
func (pg *PostgresWorkoutStore) UpdateWorkoutEntry(entry *WorkoutEntry) error {
	query := `UPDATE workout_entries
	          SET exercise = $1,
	              sets = $2,
	              reps = $3,
	              duration_seconds = $4,
	              weight = $5,
	              notes = $6,
	              order_index = $7
	          WHERE id = $8`

	result, err := pg.db.Exec(
		query,
		entry.Exercise,
		entry.Sets,
		entry.Reps,
		entry.DurationSeconds,
		entry.Weight,
		entry.Notes,
		entry.OrderIndex,
		entry.ID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// DeleteWorkout deletes a workout and its entries manually within a transaction.
func (pg *PostgresWorkoutStore) DeleteWorkout(workoutID int64) error {
	tx, err := pg.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM workout_entries WHERE workout_id = $1`, workoutID)
	if err != nil {
		return err
	}

	result, err := tx.Exec(`DELETE FROM workouts WHERE id = $1`, workoutID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

// ✅ NEW: Delete a single workout entry by ID
func (pg *PostgresWorkoutStore) DeleteWorkoutEntryByID(entryID int64) error {
	result, err := pg.db.Exec(`DELETE FROM workout_entries WHERE id = $1`, entryID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
