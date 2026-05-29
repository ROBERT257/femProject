package store

import (
	"errors"
	"crypto/rand"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgconn"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrAccountEmailExists = errors.New("email already exists")
	ErrAccountLoginExists = errors.New("login id already exists")
	ErrAccountRegNoExists = errors.New("registration number already exists")
)
type Account struct {
	ID                 int64   `json:"id"`
	Role               string  `json:"role"`
	FullName           string  `json:"full_name"`
	Email              string  `json:"email"`
	LoginID            string  `json:"login_id"`
	RegNo              string  `json:"reg_no"`
	Password           string  `json:"password,omitempty"`
	CreatedBy          string  `json:"created_by,omitempty"`
	ParentTherapistID  *int64  `json:"parent_therapist_id,omitempty"`
	PatientSequence    *int    `json:"patient_sequence,omitempty"`
	PasswordResetAt    *string `json:"password_reset_at,omitempty"`
	CreatedAt          string  `json:"created_at,omitempty"`
	UpdatedAt          string  `json:"updated_at,omitempty"`
}

type AccountStore interface {
	ListAccounts() ([]Account, error)
	ListTherapists() ([]Account, error)
	ListPatientsByTherapist(loginID string) ([]Account, error)
	Authenticate(role, loginID, password string) (*Account, error)
	CreateTherapist(fullName, email string) (*Account, error)
	ResetTherapistPassword(loginID, email string) (*Account, error)
	CreatePatient(therapistLoginID, fullName, email string) (*Account, error)
}

type PostgresAccountStore struct {
	db *sql.DB
}

func NewAccountStore(db *sql.DB) *PostgresAccountStore {
	return &PostgresAccountStore{db: db}
}

func normalizeNamePart(value string) string {
	parts := strings.Fields(strings.TrimSpace(value))
	var builder strings.Builder
	for _, part := range parts {
		if part == "" {
			continue
		}
		builder.WriteString(strings.ToUpper(string(part[0])))
		if builder.Len() == 3 {
			break
		}
	}
	if builder.Len() == 0 {
		return "THR"
	}
	return builder.String()
}

func firstLetter(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "T"
	}
	for _, r := range trimmed {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
			return strings.ToUpper(string(r))
		}
	}
	return "T"
}

func randomPassword() (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	const length = 8
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	for i, b := range bytes {
		bytes[i] = alphabet[int(b)%len(alphabet)]
	}
	return string(bytes), nil
}

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func translateAccountInsertError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return err
	}

	if pgErr.Code != "23505" {
		return err
	}

	switch pgErr.ConstraintName {
	case "accounts_email_key":
		return ErrAccountEmailExists
	case "accounts_login_id_key":
		return ErrAccountLoginExists
	case "accounts_reg_no_key":
		return ErrAccountRegNoExists
	default:
		return err
	}
}
func verifyPassword(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func mapAccount(row interface{ Scan(dest ...any) error }) (*Account, error) {
	var account Account
	var parentID sql.NullInt64
	var patientSequence sql.NullInt64
	var passwordResetAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time
	if err := row.Scan(
		&account.ID,
		&account.Role,
		&account.FullName,
		&account.Email,
		&account.LoginID,
		&account.RegNo,
		&account.CreatedBy,
		&parentID,
		&patientSequence,
		&passwordResetAt,
		&createdAt,
		&updatedAt,
	); err != nil {
		return nil, err
	}
	if parentID.Valid {
		value := parentID.Int64
		account.ParentTherapistID = &value
	}
	if patientSequence.Valid {
		value := int(patientSequence.Int64)
		account.PatientSequence = &value
	}
	if passwordResetAt.Valid {
		value := passwordResetAt.Time.Format(time.RFC3339)
		account.PasswordResetAt = &value
	}
	account.CreatedAt = createdAt.Format(time.RFC3339)
	account.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &account, nil
}

func (pg *PostgresAccountStore) listAccounts(query string, args ...any) ([]Account, error) {
	rows, err := pg.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []Account
	for rows.Next() {
		account, err := mapAccount(rows)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, *account)
	}
	return accounts, nil
}

func (pg *PostgresAccountStore) ListAccounts() ([]Account, error) {
	return pg.listAccounts(`
		SELECT id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at
		FROM accounts
		ORDER BY id DESC`)
}

func (pg *PostgresAccountStore) ListTherapists() ([]Account, error) {
	return pg.listAccounts(`
		SELECT id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at
		FROM accounts
		WHERE role = 'therapist'
		ORDER BY id DESC`)
}

func (pg *PostgresAccountStore) ListPatientsByTherapist(loginID string) ([]Account, error) {
	return pg.listAccounts(`
		SELECT a.id, a.role, a.full_name, a.email, a.login_id, a.reg_no, a.created_by, a.parent_therapist_id, a.patient_sequence, a.password_reset_at, a.created_at, a.updated_at
		FROM accounts a
		JOIN accounts therapist ON therapist.id = a.parent_therapist_id
		WHERE a.role = 'patient' AND therapist.login_id = $1
		ORDER BY a.patient_sequence ASC`, loginID)
}

func (pg *PostgresAccountStore) Authenticate(role, loginID, password string) (*Account, error) {
	var account Account
	var passwordHash string
	var parentID sql.NullInt64
	var patientSequence sql.NullInt64
	var passwordResetAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time

	query := `
		SELECT id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at, password_hash
		FROM accounts
		WHERE role = $1 AND login_id = $2`
	args := []any{role, loginID}
	if role == "patient" {
		query = `
			SELECT id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at, password_hash
			FROM accounts
			WHERE role = $1 AND (login_id = $2 OR reg_no = $2)`
	}

	err := pg.db.QueryRow(query, args...).Scan(
		&account.ID,
		&account.Role,
		&account.FullName,
		&account.Email,
		&account.LoginID,
		&account.RegNo,
		&account.CreatedBy,
		&parentID,
		&patientSequence,
		&passwordResetAt,
		&createdAt,
		&updatedAt,
		&passwordHash,
	)
	if err != nil {
		return nil, err
	}

	if err := verifyPassword(passwordHash, password); err != nil {
		return nil, sql.ErrNoRows
	}

	if parentID.Valid {
		value := parentID.Int64
		account.ParentTherapistID = &value
	}
	if patientSequence.Valid {
		value := int(patientSequence.Int64)
		account.PatientSequence = &value
	}
	if passwordResetAt.Valid {
		value := passwordResetAt.Time.Format(time.RFC3339)
		account.PasswordResetAt = &value
	}
	account.CreatedAt = createdAt.Format(time.RFC3339)
	account.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &account, nil
}

func (pg *PostgresAccountStore) CreateTherapist(fullName, email string) (*Account, error) {
	count := 0
	if err := pg.db.QueryRow(`SELECT COUNT(*) FROM accounts WHERE role = 'therapist'`).Scan(&count); err != nil {
		return nil, err
	}

	loginID := fmt.Sprintf("THR-%s%03d", normalizeNamePart(fullName), count+1)
	password, err := randomPassword()
	if err != nil {
		return nil, err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return nil, err
	}

	var account Account
	err = pg.db.QueryRow(`
		INSERT INTO accounts (role, full_name, email, login_id, password_hash, reg_no, created_by)
		VALUES ('therapist', $1, $2, $3, $4, $3, 'admin')
		RETURNING id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at`,
		fullName, email, loginID, hash).Scan(
		&account.ID,
		&account.Role,
		&account.FullName,
		&account.Email,
		&account.LoginID,
		&account.RegNo,
		&account.CreatedBy,
		&account.ParentTherapistID,
		&account.PatientSequence,
		&account.PasswordResetAt,
		&account.CreatedAt,
		&account.UpdatedAt,
	)
	if err != nil {
		return nil, translateAccountInsertError(err)
	}

	account.Password = password
	return &account, nil
}

func (pg *PostgresAccountStore) ResetTherapistPassword(loginID, email string) (*Account, error) {
	var account Account
	var passwordHash string
	var parentID sql.NullInt64
	var patientSequence sql.NullInt64
	var passwordResetAt sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time
	err := pg.db.QueryRow(`
		SELECT id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at, password_hash
		FROM accounts
		WHERE role = 'therapist' AND login_id = $1 AND email = $2`, loginID, email).Scan(
		&account.ID,
		&account.Role,
		&account.FullName,
		&account.Email,
		&account.LoginID,
		&account.RegNo,
		&account.CreatedBy,
		&parentID,
		&patientSequence,
		&passwordResetAt,
		&createdAt,
		&updatedAt,
		&passwordHash,
	)
	if err != nil {
		return nil, err
	}

	newPassword, err := randomPassword()
	if err != nil {
		return nil, err
	}
	hash, err := hashPassword(newPassword)
	if err != nil {
		return nil, err
	}

	_, err = pg.db.Exec(`UPDATE accounts SET password_hash = $1, password_reset_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, hash, account.ID)
	if err != nil {
		return nil, err
	}

	if parentID.Valid {
		value := parentID.Int64
		account.ParentTherapistID = &value
	}
	if patientSequence.Valid {
		value := int(patientSequence.Int64)
		account.PatientSequence = &value
	}
	resetAt := time.Now().Format(time.RFC3339)
	account.PasswordResetAt = &resetAt
	account.CreatedAt = createdAt.Format(time.RFC3339)
	account.UpdatedAt = updatedAt.Format(time.RFC3339)
	account.Password = newPassword
	return &account, nil
}

func (pg *PostgresAccountStore) CreatePatient(therapistLoginID, fullName, email string) (*Account, error) {
	var therapist Account
	var therapistHash string
	var therapistCreatedAt time.Time
	var therapistUpdatedAt time.Time
	if err := pg.db.QueryRow(`
		SELECT id, role, full_name, email, login_id, reg_no, created_by, password_hash, created_at, updated_at
		FROM accounts
		WHERE role = 'therapist' AND login_id = $1`, therapistLoginID).Scan(
		&therapist.ID,
		&therapist.Role,
		&therapist.FullName,
		&therapist.Email,
		&therapist.LoginID,
		&therapist.RegNo,
		&therapist.CreatedBy,
		&therapistHash,
		&therapistCreatedAt,
		&therapistUpdatedAt,
	); err != nil {
		return nil, err
	}

	count := 0
	if err := pg.db.QueryRow(`SELECT COUNT(*) FROM accounts WHERE role = 'patient' AND parent_therapist_id = $1`, therapist.ID).Scan(&count); err != nil {
		return nil, err
	}

	sequence := count + 1
	regNo := fmt.Sprintf("%s-%03d", therapist.LoginID, sequence)
	patientLoginID := regNo
	patientPassword := fmt.Sprintf("P%03d", sequence)
	hash, err := hashPassword(patientPassword)
	if err != nil {
		return nil, err
	}

	var account Account
	err = pg.db.QueryRow(`
		INSERT INTO accounts (role, full_name, email, login_id, password_hash, reg_no, parent_therapist_id, patient_sequence, created_by)
		VALUES ('patient', $1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, role, full_name, email, login_id, reg_no, created_by, parent_therapist_id, patient_sequence, password_reset_at, created_at, updated_at`,
		fullName, email, patientLoginID, hash, regNo, therapist.ID, sequence, therapist.LoginID).Scan(
		&account.ID,
		&account.Role,
		&account.FullName,
		&account.Email,
		&account.LoginID,
		&account.RegNo,
		&account.CreatedBy,
		&account.ParentTherapistID,
		&account.PatientSequence,
		&account.PasswordResetAt,
		&account.CreatedAt,
		&account.UpdatedAt,
	)
	if err != nil {
		return nil, translateAccountInsertError(err)
	}

	account.Password = patientPassword
	return &account, nil
}