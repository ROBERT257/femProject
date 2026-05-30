package wearable

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
    "time"
)

// GoogleFitClient implements lightweight calls to Google Fit REST APIs.
type GoogleFitClient struct {
    ClientID string
    Secret   string
    BaseURL  string // optional override for tests
}

func (c *GoogleFitClient) baseURL() string {
    if c.BaseURL != "" {
        return strings.TrimRight(c.BaseURL, "/")
    }
    return "https://www.googleapis.com/fitness/v1"
}

// FetchSteps returns the sum of steps between start and end.
func (c *GoogleFitClient) FetchSteps(ctx context.Context, httpClient *http.Client, start, end time.Time) (int, error) {
    v, err := c.aggregateInt(ctx, httpClient, start, end, "com.google.step_count.delta")
    return int(v), err
}

// FetchCalories returns calories expended sum.
func (c *GoogleFitClient) FetchCalories(ctx context.Context, httpClient *http.Client, start, end time.Time) (int, error) {
    v, err := c.aggregateInt(ctx, httpClient, start, end, "com.google.calories.expended")
    return int(v), err
}

// FetchHeartRate returns average heart rate (rounded int) over period.
func (c *GoogleFitClient) FetchHeartRate(ctx context.Context, httpClient *http.Client, start, end time.Time) (int, error) {
    // For heart rate, compute average of sampled bpm values
    // We'll call aggregate and compute mean
    points, err := c.aggregatePoints(ctx, httpClient, start, end, "com.google.heart_rate.bpm")
    if err != nil {
        return 0, err
    }
    if len(points) == 0 {
        return 0, nil
    }
    var sum float64
    for _, p := range points {
        sum += p
    }
    avg := int(sum/float64(len(points)) + 0.5)
    return avg, nil
}

// FetchSleep returns total sleep hours in the period by summing sessions with 'sleep' in the name/description.
func (c *GoogleFitClient) FetchSleep(ctx context.Context, httpClient *http.Client, start, end time.Time) (float64, error) {
    // Use sessions endpoint
    url := fmt.Sprintf("%s/users/me/sessions?startTime=%s&endTime=%s", c.baseURL(), start.Format(time.RFC3339), end.Format(time.RFC3339))
    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := httpClient.Do(req)
    if err != nil {
        return 0, err
    }
    defer resp.Body.Close()
    if resp.StatusCode >= 400 {
        b, _ := io.ReadAll(resp.Body)
        return 0, fmt.Errorf("sessions request failed: %s", string(b))
    }
    var out struct {
        Session []struct {
            Name          string `json:"name"`
            Description   string `json:"description"`
            StartTimeMillis string `json:"startTimeMillis"`
            EndTimeMillis   string `json:"endTimeMillis"`
        } `json:"session"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
        return 0, err
    }
    var totalMs int64
    for _, s := range out.Session {
        name := strings.ToLower(s.Name + " " + s.Description)
        if strings.Contains(name, "sleep") {
            startMs, _ := parseMillis(s.StartTimeMillis)
            endMs, _ := parseMillis(s.EndTimeMillis)
            if endMs > startMs {
                totalMs += (endMs - startMs)
            }
        }
    }
    hours := float64(totalMs) / 1000.0 / 60.0 / 60.0
    return hours, nil
}

// FetchActivities returns raw session summaries.
func (c *GoogleFitClient) FetchActivities(ctx context.Context, httpClient *http.Client, start, end time.Time) ([]map[string]any, error) {
    url := fmt.Sprintf("%s/users/me/sessions?startTime=%s&endTime=%s", c.baseURL(), start.Format(time.RFC3339), end.Format(time.RFC3339))
    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    if resp.StatusCode >= 400 {
        b, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("sessions request failed: %s", string(b))
    }
    var out map[string]any
    if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
        return nil, err
    }
    // Return as-is for now
    if s, ok := out["session"].([]any); ok {
        res := make([]map[string]any, 0, len(s))
        for _, v := range s {
            if m, ok := v.(map[string]any); ok {
                res = append(res, m)
            }
        }
        return res, nil
    }
    return nil, nil
}

// Helper: parse milliseconds string
func parseMillis(s string) (int64, error) {
    if s == "" {
        return 0, nil
    }
    // sometimes value is a number as string
    var v int64
    _, err := fmt.Sscanf(s, "%d", &v)
    if err != nil {
        return 0, err
    }
    return v, nil
}

// aggregateInt performs a dataset:aggregate call and sums integer values.
func (c *GoogleFitClient) aggregateInt(ctx context.Context, httpClient *http.Client, start, end time.Time, dataType string) (int64, error) {
    points, err := c.aggregatePoints(ctx, httpClient, start, end, dataType)
    if err != nil {
        return 0, err
    }
    var sum float64
    for _, v := range points {
        sum += v
    }
    return int64(sum + 0.5), nil
}

// aggregatePoints returns raw numeric values from aggregate response.
func (c *GoogleFitClient) aggregatePoints(ctx context.Context, httpClient *http.Client, start, end time.Time, dataType string) ([]float64, error) {
    url := fmt.Sprintf("%s/users/me/dataset:aggregate", c.baseURL())
    body := map[string]any{
        "aggregateBy": []map[string]string{{"dataTypeName": dataType}},
        "startTimeMillis": fmt.Sprintf("%d", start.UnixNano()/int64(time.Millisecond)),
        "endTimeMillis":   fmt.Sprintf("%d", end.UnixNano()/int64(time.Millisecond)),
    }
    b, _ := json.Marshal(body)
    req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
    req.Header.Set("Content-Type", "application/json")
    resp, err := httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    if resp.StatusCode >= 400 {
        rb, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("aggregate failed: %s", string(rb))
    }
    var out struct {
        Bucket []struct {
            Dataset []struct {
                Point []struct {
                    Value []struct {
                        IntVal    *int64   `json:"intVal,omitempty"`
                        FpVal     *float64 `json:"fpVal,omitempty"`
                        DoubleVal *float64 `json:"doubleVal,omitempty"`
                    } `json:"value"`
                } `json:"point"`
            } `json:"dataset"`
        } `json:"bucket"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
        return nil, err
    }
    var values []float64
    for _, bkt := range out.Bucket {
        for _, ds := range bkt.Dataset {
            for _, p := range ds.Point {
                for _, v := range p.Value {
                    if v.IntVal != nil {
                        values = append(values, float64(*v.IntVal))
                    } else if v.FpVal != nil {
                        values = append(values, *v.FpVal)
                    } else if v.DoubleVal != nil {
                        values = append(values, *v.DoubleVal)
                    }
                }
            }
        }
    }
    return values, nil
}
