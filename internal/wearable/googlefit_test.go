package wearable

import (
    "context"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"
)

func TestFetchSteps(t *testing.T) {
    // Mock server returns one bucket with one dataset point intVal=1234
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/users/me/dataset:aggregate" {
            http.NotFound(w, r)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        _, _ = w.Write([]byte(`{"bucket":[{"dataset":[{"point":[{"value":[{"intVal":1234}]}]}]}]}`))
    }))
    defer srv.Close()

    client := &GoogleFitClient{BaseURL: srv.URL}
    httpClient := srv.Client()
    start := time.Now().Add(-24 * time.Hour)
    end := time.Now()
    v, err := client.FetchSteps(context.Background(), httpClient, start, end)
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if v != 1234 {
        t.Fatalf("expected 1234 steps, got %d", v)
    }
}
