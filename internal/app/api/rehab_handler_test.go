package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ROBERT257/femProject/internal/store"
	"github.com/go-chi/chi"
)

type mockRehabStore struct {
	storedPlan *store.RehabPlan
	updated    *store.RehabPlan
}

func (m *mockRehabStore) CreateRehabPlan(p *store.RehabPlan) (*store.RehabPlan, error) {
	m.storedPlan = p
	p.ID = 3
	return p, nil
}
func (m *mockRehabStore) GetRehabPlanByID(id int64) (*store.RehabPlan, error) {
	return m.storedPlan, nil
}
func (m *mockRehabStore) ListRehabPlans() ([]store.RehabPlan, error)       { return []store.RehabPlan{}, nil }
func (m *mockRehabStore) UpdateRehabPlan(p *store.RehabPlan) error         { m.updated = p; return nil }
func (m *mockRehabStore) DeleteRehabPlan(id int64) error                   { return nil }
func (m *mockRehabStore) UpdateRehabExercise(e *store.RehabExercise) error { return nil }
func (m *mockRehabStore) DeleteRehabExerciseByID(id int64) error           { return nil }
func (m *mockRehabStore) AnalyticsSnapshot(days int, patientID *int64) ([]store.AnalyticsPoint, error) {
	return []store.AnalyticsPoint{}, nil
}

func TestHandleUpdateRehabPlan_PartialMerge(t *testing.T) {
	// Setup mock store with an existing plan
	existing := &store.RehabPlan{ID: 3, PatientName: "Alice", TherapistName: "Dr. X", Title: "Plan A", Goal: "Recover"}
	mock := &mockRehabStore{storedPlan: existing}
	h := NewRehabHandler(mock)

	// Create request to update only patient_name
	payload := map[string]string{"patient_name": "John Doe"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPatch, "/rehab-plans/3", bytes.NewReader(body))
	// set chi route context so chi.URLParam works inside handler
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "3")
	// attach our route context
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	// attach chi URL param by using a recorder and setting URL accordingly
	rw := httptest.NewRecorder()

	// Call handler
	h.HandleUpdateRehabPlan(rw, req)

	if rw.Code != http.StatusNoContent {
		t.Fatalf("expected 204 No Content, got %d: %s", rw.Code, rw.Body.String())
	}

	if mock.updated == nil {
		t.Fatalf("expected UpdateRehabPlan to be called")
	}

	if mock.updated.PatientName != "John Doe" {
		t.Fatalf("expected patient name to be updated, got %q", mock.updated.PatientName)
	}
	if mock.updated.Title != "Plan A" {
		t.Fatalf("expected other fields to be preserved, got title=%q", mock.updated.Title)
	}
}
