package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/ROBERT257/femProject/internal/store"
	"github.com/go-chi/chi"
)

type AccountHandler struct {
	accountStore store.AccountStore
	emailSender  EmailSender
}

func NewAccountHandler(accountStore store.AccountStore, emailSender EmailSender) *AccountHandler {
	return &AccountHandler{accountStore: accountStore, emailSender: emailSender}
}

type createTherapistRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
}

type createPatientRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
}

type loginRequest struct {
	Role    string `json:"role"`
	LoginID string `json:"login_id"`
	Password string `json:"password"`
}

type resetTherapistPasswordRequest struct {
	Email string `json:"email"`
}

func accountResponse(account *store.Account) map[string]any {
	return map[string]any{
		"id": account.ID,
		"role": account.Role,
		"full_name": account.FullName,
		"email": account.Email,
		"login_id": account.LoginID,
		"reg_no": account.RegNo,
		"created_by": account.CreatedBy,
		"parent_therapist_id": account.ParentTherapistID,
		"patient_sequence": account.PatientSequence,
		"created_at": account.CreatedAt,
		"updated_at": account.UpdatedAt,
		"password_reset_at": account.PasswordResetAt,
	}
}

func (h *AccountHandler) HandleListAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := h.accountStore.ListAccounts()
	if err != nil {
		http.Error(w, "failed to list accounts", http.StatusInternalServerError)
		return
	}

	out := make([]map[string]any, 0, len(accounts))
	for i := range accounts {
		account := accounts[i]
		out = append(out, accountResponse(&account))
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

func (h *AccountHandler) HandleCreateTherapist(w http.ResponseWriter, r *http.Request) {
	var payload createTherapistRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	account, err := h.accountStore.CreateTherapist(payload.FullName, payload.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if h.emailSender != nil {
		body := strings.Join([]string{
			"Your RehabTrack therapist account is ready.",
			"",
			fmt.Sprintf("Therapist ID: %s", account.LoginID),
			fmt.Sprintf("Temporary password: %s", account.Password),
			"",
			"Use the therapist login page to sign in, then reset your password after first login if needed.",
		}, "\n")
		if err := h.emailSender.Send(account.Email, "RehabTrack therapist credentials", body); err != nil {
			http.Error(w, "failed to send therapist email", http.StatusBadGateway)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"account": accountResponse(account),
		"email_notice": "Therapist account created and emailed.",
	})
}

func (h *AccountHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var payload loginRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	account, err := h.accountStore.Authenticate(payload.Role, payload.LoginID, payload.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"account": accountResponse(account)})
}

func (h *AccountHandler) HandleResetTherapistPassword(w http.ResponseWriter, r *http.Request) {
	therapistID := chi.URLParam(r, "therapistID")
	if therapistID == "" {
		http.Error(w, "therapist id required", http.StatusBadRequest)
		return
	}

	var payload resetTherapistPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	account, err := h.accountStore.ResetTherapistPassword(therapistID, payload.Email)
	if err != nil {
		http.Error(w, "no therapist account matched that id and email", http.StatusNotFound)
		return
	}

	if h.emailSender != nil {
		body := strings.Join([]string{
			"Your RehabTrack therapist password has been reset.",
			"",
			fmt.Sprintf("Therapist ID: %s", account.LoginID),
			fmt.Sprintf("New temporary password: %s", account.Password),
			"",
			"Use the therapist login page to sign in, then reset again if needed.",
		}, "\n")
		if err := h.emailSender.Send(account.Email, "RehabTrack password reset", body); err != nil {
			http.Error(w, "failed to send therapist email", http.StatusBadGateway)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"account": accountResponse(account)})
}

func (h *AccountHandler) HandleCreatePatient(w http.ResponseWriter, r *http.Request) {
	therapistID := chi.URLParam(r, "therapistID")
	if therapistID == "" {
		http.Error(w, "therapist id required", http.StatusBadRequest)
		return
	}

	var payload createPatientRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	account, err := h.accountStore.CreatePatient(therapistID, payload.FullName, payload.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if h.emailSender != nil {
		body := strings.Join([]string{
			"Your RehabTrack patient account is ready.",
			"",
			fmt.Sprintf("Patient reg number: %s", account.RegNo),
			fmt.Sprintf("Temporary password: %s", account.Password),
			"",
			"Use the patient login page to sign in with your reg number and temporary password.",
		}, "\n")
		if err := h.emailSender.Send(account.Email, "RehabTrack patient credentials", body); err != nil {
			http.Error(w, "failed to send patient email", http.StatusBadGateway)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"account": accountResponse(account)})
}

func (h *AccountHandler) HandleListPatientsByTherapist(w http.ResponseWriter, r *http.Request) {
	therapistID := chi.URLParam(r, "therapistID")
	if therapistID == "" {
		http.Error(w, "therapist id required", http.StatusBadRequest)
		return
	}

	accounts, err := h.accountStore.ListPatientsByTherapist(therapistID)
	if err != nil {
		http.Error(w, "failed to list patients", http.StatusInternalServerError)
		return
	}

	out := make([]map[string]any, 0, len(accounts))
	for i := range accounts {
		account := accounts[i]
		out = append(out, accountResponse(&account))
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}