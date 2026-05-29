package analytics

// TrendPoint represents a sampled metric point.
type TrendPoint struct {
	Label string
	Value float64
}

// AverageTrend returns the mean of a series, or zero for empty input.
func AverageTrend(values []int) float64 {
	if len(values) == 0 {
		return 0
	}

	var sum int
	for _, value := range values {
		sum += value
	}
	return float64(sum) / float64(len(values))
}

// PainTrend returns the change between the latest and earliest pain score.
func PainTrend(values []int) float64 {
	if len(values) < 2 {
		return 0
	}
	return float64(values[len(values)-1] - values[0])
}

// FatigueTrend returns the change between the latest and earliest fatigue score.
func FatigueTrend(values []int) float64 {
	if len(values) < 2 {
		return 0
	}
	return float64(values[len(values)-1] - values[0])
}
