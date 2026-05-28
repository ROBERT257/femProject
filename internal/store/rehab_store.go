package store

import (
	"database/sql"
	"errors"
	"time"
)

// RehabPlan represents a rehabilitation plan.
type RehabPlan struct {
	ID            int             `json:"id"`
	PatientName   string          `json:"patient_name"`
	TherapistName string          `json:"therapist_name"`
	Title         string          `json:"title"`
	Goal          string          `json:"goal"`
	Status        string          `json:"status"`
	StartDate     string          `json:"start_date"`
	Description   string          `json:"description"`
	EntryCount    int             `json:"entry_count,omitempty"`
	AveragePain   float64         `json:"average_pain,omitempty"`
	Entries       []RehabExercise `json:"entries"`
}

// RehabExercise represents an individual exercise in a rehabilitation plan.
type RehabExercise struct {
	ID                int      `json:"id"`
	Exercise          string   `json:"exercise"`
	Sets              int      `json:"sets"`
	Reps              *int     `json:"reps"`
	DurationSeconds   *int     `json:"duration_seconds"`
	Weight            *float64 `json:"weight"`
	Notes             string   `json:"notes"`
	OrderIndex        int      `json:"order_index"`
	CompletionStatus  string   `json:"completion_status"`
	PainLevel         int      `json:"pain_level"`
	PatientNotes      string   `json:"patient_notes"`
	TherapistComments string   `json:"therapist_comments"`
}

// RehabStore defines methods to interact with the rehabilitation data.
type RehabStore interface {
	CreateRehabPlan(*RehabPlan) (*RehabPlan, error)
	GetRehabPlanByID(int64) (*RehabPlan, error)
	ListRehabPlans() ([]RehabPlan, error)
	UpdateRehabPlan(*RehabPlan) error
	DeleteRehabPlan(int64) error
	UpdateRehabExercise(*RehabExercise) error
	DeleteRehabExerciseByID(int64) error
}

// PostgresRehabStore implements the RehabStore interface using PostgreSQL.
type PostgresRehabStore struct {
	db *sql.DB
}

// NewRehabStore creates a new instance of PostgresRehabStore.
func NewRehabStore(db *sql.DB) *PostgresRehabStore {
	return &PostgresRehabStore{db: db}
}

// CreateRehabPlan inserts a new rehab plan and its exercises into the database.
func (pg *PostgresRehabStore) CreateRehabPlan(rehabPlan *RehabPlan) (*RehabPlan, error) {
	tx, err := pg.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Ensure legacy required columns are provided (duration_minutes, calories_burned)
	// Provide start_date explicitly (use today's date when not provided) to avoid NULL constraint issues.
	startDate := rehabPlan.StartDate
	if startDate == "" {
		startDate = time.Now().Format("2006-01-02")
	}

	query := `INSERT INTO workouts (patient_name, therapist_name, title, goal, status, start_date, description, duration_minutes, calories_burned)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`
	var rehabPlanID int
	err = tx.QueryRow(query, rehabPlan.PatientName, rehabPlan.TherapistName, rehabPlan.Title, rehabPlan.Goal, rehabPlan.Status, startDate, rehabPlan.Description, 0, 0).Scan(&rehabPlanID)
	if err != nil {
		return nil, err
	}

	for i, entry := range rehabPlan.Entries {
		query = `INSERT INTO workout_entries (workout_id, exercise_name, sets, reps, duration_seconds, weight, notes, order_index, completion_status, pain_level, patient_notes, therapist_comments)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				 RETURNING id`
		err = tx.QueryRow(query, rehabPlanID, entry.Exercise, entry.Sets, entry.Reps, entry.DurationSeconds, entry.Weight, entry.Notes, entry.OrderIndex, entry.CompletionStatus, entry.PainLevel, entry.PatientNotes, entry.TherapistComments).Scan(&entry.ID)
		if err != nil {
			return nil, err
		}
		rehabPlan.Entries[i].ID = entry.ID
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	rehabPlan.ID = rehabPlanID
	return rehabPlan, nil
}

// GetRehabPlanByID fetches a rehab plan and its exercises by ID.
func (pg *PostgresRehabStore) GetRehabPlanByID(rehabPlanID int64) (*RehabPlan, error) {
	rehabPlan := &RehabPlan{}
	query := `SELECT id, patient_name, therapist_name, title, goal, status, start_date, description
              FROM workouts WHERE id = $1`
	err := pg.db.QueryRow(query, rehabPlanID).Scan(&rehabPlan.ID, &rehabPlan.PatientName, &rehabPlan.TherapistName, &rehabPlan.Title, &rehabPlan.Goal, &rehabPlan.Status, &rehabPlan.StartDate, &rehabPlan.Description)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, err
	}

	entriesQuery := `SELECT id, exercise_name, sets, reps, duration_seconds, weight, notes, order_index, completion_status, pain_level, patient_notes, therapist_comments
					 FROM workout_entries
					 WHERE workout_id = $1
					 ORDER BY order_index`

	rows, err := pg.db.Query(entriesQuery, rehabPlanID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var entry RehabExercise
		err := rows.Scan(&entry.ID, &entry.Exercise, &entry.Sets, &entry.Reps, &entry.DurationSeconds, &entry.Weight, &entry.Notes, &entry.OrderIndex, &entry.CompletionStatus, &entry.PainLevel, &entry.PatientNotes, &entry.TherapistComments)
		if err != nil {
			return nil, err
		}
		rehabPlan.Entries = append(rehabPlan.Entries, entry)
	}

	return rehabPlan, nil
}

// UpdateRehabPlan updates an existing rehab plan's main details.
func (pg *PostgresRehabStore) UpdateRehabPlan(rehabPlan *RehabPlan) error {
	query := `UPDATE workouts 
			  SET patient_name = $1, therapist_name = $2, title = $3, goal = $4, status = $5, start_date = NULLIF($6, '')::date, description = $7
			  WHERE id = $8`

	result, err := pg.db.Exec(query, rehabPlan.PatientName, rehabPlan.TherapistName, rehabPlan.Title, rehabPlan.Goal, rehabPlan.Status, rehabPlan.StartDate, rehabPlan.Description, rehabPlan.ID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("no rehab plan found to update")
	}

	return nil
}

// UpdateRehabExercise updates an individual rehab exercise by ID.
func (pg *PostgresRehabStore) UpdateRehabExercise(entry *RehabExercise) error {
	query := `UPDATE workout_entries
			  SET exercise_name = $1,
			      sets = $2,
			      reps = $3,
			      duration_seconds = $4,
			      weight = $5,
			      notes = $6,
			      order_index = $7,
			      completion_status = $8,
			      pain_level = $9,
			      patient_notes = $10,
			      therapist_comments = $11
			  WHERE id = $12`

	result, err := pg.db.Exec(
		query,
		entry.Exercise,
		entry.Sets,
		entry.Reps,
		entry.DurationSeconds,
		entry.Weight,
		entry.Notes,
		entry.OrderIndex,
		entry.CompletionStatus,
		entry.PainLevel,
		entry.PatientNotes,
		entry.TherapistComments,
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

// DeleteRehabPlan deletes a rehab plan and its entries manually within a transaction.
func (pg *PostgresRehabStore) DeleteRehabPlan(rehabPlanID int64) error {
	tx, err := pg.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM workout_entries WHERE workout_id = $1`, rehabPlanID)
	if err != nil {
		return err
	}

	result, err := tx.Exec(`DELETE FROM workouts WHERE id = $1`, rehabPlanID)
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

// DeleteRehabExerciseByID deletes a single rehab exercise by ID.
func (pg *PostgresRehabStore) DeleteRehabExerciseByID(entryID int64) error {
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

// ListRehabPlans returns a list of rehabilitation plans (without exercises) for overview screens.
func (pg *PostgresRehabStore) ListRehabPlans() ([]RehabPlan, error) {
	rows, err := pg.db.Query(`
		SELECT
			w.id,
			w.patient_name,
			w.therapist_name,
			w.title,
			w.goal,
			w.status,
			w.start_date,
			w.description,
			COUNT(e.id) AS entry_count,
			COALESCE(AVG(e.pain_level), 0) AS average_pain
		FROM workouts w
		LEFT JOIN workout_entries e ON e.workout_id = w.id
		GROUP BY w.id, w.patient_name, w.therapist_name, w.title, w.goal, w.status, w.start_date, w.description
		ORDER BY w.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []RehabPlan
	for rows.Next() {
		var p RehabPlan
		var patientName, therapistName, title, goal, status, startDate, description sql.NullString
		if err := rows.Scan(&p.ID, &patientName, &therapistName, &title, &goal, &status, &startDate, &description, &p.EntryCount, &p.AveragePain); err != nil {
			return nil, err
		}
		if patientName.Valid {
			p.PatientName = patientName.String
		}
		if therapistName.Valid {
			p.TherapistName = therapistName.String
		}
		if title.Valid {
			p.Title = title.String
		}
		if goal.Valid {
			p.Goal = goal.String
		}
		if status.Valid {
			p.Status = status.String
		}
		if startDate.Valid {
			p.StartDate = startDate.String
		}
		if description.Valid {
			p.Description = description.String
		}
		plans = append(plans, p)
	}

	return plans, nil
}