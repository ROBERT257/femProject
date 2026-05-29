package wearable

import "time"

// DataPoint represents a wearable data sample.
type DataPoint struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	Source     string    `json:"source"`
	Steps      int       `json:"steps"`
	HeartRate  *int      `json:"heart_rate,omitempty"`
	SleepHours *float64  `json:"sleep_hours,omitempty"`
	Calories   *int      `json:"calories,omitempty"`
	RecordedAt time.Time `json:"recorded_at"`
}
