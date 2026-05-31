package store

import (
	"database/sql"
	"errors"
	"time"
)

// RehabPlan represents a rehabilitation plan.
type RehabPlan struct {
	ID            int             `json:"id"`
	PatientID     int64           `json:"patient_id,omitempty"`
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
	FatigueLevel      int      `json:"fatigue_level"`
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
	AnalyticsSnapshot(days int, patientID *int64) ([]AnalyticsPoint, error)
}

// AnalyticsPoint contains aggregated metrics for a single day
type AnalyticsPoint struct {
	Day       string  `json:"day"`
	Pain      float64 `json:"pain"`
	Fatigue   float64 `json:"fatigue"`
	Adherence int     `json:"adherence"`
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

	query := `INSERT INTO workouts (patient_id, patient_name, therapist_name, title, goal, status, start_date, description, duration_minutes, calories_burned)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`
	var rehabPlanID int
	var patientID sql.NullInt64
	if rehabPlan.PatientID != 0 {
		patientID = sql.NullInt64{Int64: rehabPlan.PatientID, Valid: true}
	}
	err = tx.QueryRow(query, patientID, rehabPlan.PatientName, rehabPlan.TherapistName, rehabPlan.Title, rehabPlan.Goal, rehabPlan.Status, startDate, rehabPlan.Description, 0, 0).Scan(&rehabPlanID)
	if err != nil {
		return nil, err
	}

	for i, entry := range rehabPlan.Entries {
		// Ensure DB constraint for workout_entries: either reps or duration_seconds must be set (and not both).
		if entry.Reps == nil && entry.DurationSeconds == nil {
			// default to a reasonable reps value when none provided
			defaultReps := 10
			entry.Reps = &defaultReps
		}

		query = `INSERT INTO workout_entries (workout_id, exercise_name, sets, reps, duration_seconds, weight, notes, order_index, completion_status, pain_level, fatigue_level, patient_notes, therapist_comments)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
				 RETURNING id`
		err = tx.QueryRow(query, rehabPlanID, entry.Exercise, entry.Sets, entry.Reps, entry.DurationSeconds, entry.Weight, entry.Notes, entry.OrderIndex, entry.CompletionStatus, entry.PainLevel, entry.FatigueLevel, entry.PatientNotes, entry.TherapistComments).Scan(&entry.ID)
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
	query := `SELECT id, patient_id, patient_name, therapist_name, title, goal, status, start_date, description
			  FROM workouts WHERE id = $1`
	var patientID sql.NullInt64
	err := pg.db.QueryRow(query, rehabPlanID).Scan(&rehabPlan.ID, &patientID, &rehabPlan.PatientName, &rehabPlan.TherapistName, &rehabPlan.Title, &rehabPlan.Goal, &rehabPlan.Status, &rehabPlan.StartDate, &rehabPlan.Description)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, err
	}
	if patientID.Valid {
		rehabPlan.PatientID = patientID.Int64
	}

	entriesQuery := `SELECT id, exercise_name, sets, reps, duration_seconds, weight, notes, order_index, completion_status, pain_level, fatigue_level, patient_notes, therapist_comments
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
		err := rows.Scan(&entry.ID, &entry.Exercise, &entry.Sets, &entry.Reps, &entry.DurationSeconds, &entry.Weight, &entry.Notes, &entry.OrderIndex, &entry.CompletionStatus, &entry.PainLevel, &entry.FatigueLevel, &entry.PatientNotes, &entry.TherapistComments)
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
			  SET patient_id = NULLIF($1, 0), patient_name = $2, therapist_name = $3, title = $4, goal = $5, status = $6, start_date = NULLIF($7, '')::date, description = $8
			  WHERE id = $9`

	result, err := pg.db.Exec(query, rehabPlan.PatientID, rehabPlan.PatientName, rehabPlan.TherapistName, rehabPlan.Title, rehabPlan.Goal, rehabPlan.Status, rehabPlan.StartDate, rehabPlan.Description, rehabPlan.ID)
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
	// When an exercise is marked completed, set completed_at to now(); otherwise clear it.
	var completedAt interface{}
	if entry.CompletionStatus == "completed" {
		completedAt = time.Now()
	}
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
				  fatigue_level = $10,
				  patient_notes = $11,
				  therapist_comments = $12,
				  completed_at = $13
			  WHERE id = $14`

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
		entry.FatigueLevel,
		entry.PatientNotes,
		entry.TherapistComments,
		completedAt,
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
			w.patient_id,
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
		GROUP BY w.id, w.patient_id, w.patient_name, w.therapist_name, w.title, w.goal, w.status, w.start_date, w.description
		ORDER BY w.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []RehabPlan
	for rows.Next() {
		var p RehabPlan
		var patientID sql.NullInt64
		var patientName, therapistName, title, goal, status, startDate, description sql.NullString
		if err := rows.Scan(&p.ID, &patientID, &patientName, &therapistName, &title, &goal, &status, &startDate, &description, &p.EntryCount, &p.AveragePain); err != nil {
			return nil, err
		}
		if patientID.Valid {
			p.PatientID = patientID.Int64
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

// AnalyticsSnapshot returns daily aggregated metrics for the last `days` days (including today).
func (pg *PostgresRehabStore) AnalyticsSnapshot(days int, patientID *int64) ([]AnalyticsPoint, error) {
	if days <= 0 {
		days = 7
	}

	query := `WITH days AS (
		SELECT generate_series(date_trunc('day', now()) - ($1::int - 1) * interval '1 day', date_trunc('day', now()), '1 day') AS day
	), stats AS (
		SELECT date_trunc('day', COALESCE(e.completed_at, w.start_date))::date AS day,
			   AVG(COALESCE(e.pain_level,0))::numeric::float8 AS avg_pain,
			   AVG(COALESCE(e.fatigue_level,0))::numeric::float8 AS avg_fatigue,
			   COUNT(*) FILTER (WHERE e.completion_status = 'completed') AS completed,
			   COUNT(*) AS prescribed
		FROM workout_entries e
		JOIN workouts w ON w.id = e.workout_id
		WHERE date_trunc('day', COALESCE(e.completed_at, w.start_date)) >= date_trunc('day', now()) - ($1::int - 1) * interval '1 day'
		  AND ($2::bigint IS NULL OR w.patient_id = $2::bigint)
		GROUP BY day
	)
	SELECT to_char(d.day, 'Dy') AS day_name,
		   COALESCE(s.avg_pain, 0) AS pain,
		   COALESCE(s.avg_fatigue, 0) AS fatigue,
		   COALESCE(ROUND((s.completed::decimal / NULLIF(s.prescribed,0)) * 100), 0)::int AS adherence
	FROM days d
	LEFT JOIN stats s ON d.day::date = s.day
	ORDER BY d.day;`

	rows, err := pg.db.Query(query, days, patientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []AnalyticsPoint
	for rows.Next() {
		var p AnalyticsPoint
		if err := rows.Scan(&p.Day, &p.Pain, &p.Fatigue, &p.Adherence); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}
