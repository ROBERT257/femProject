package recommendation

// Service coordinates recommendation generation.
type Service struct {
	engine *Engine
}

// NewService creates the recommendation service.
func NewService(engine *Engine) *Service {
	return &Service{engine: engine}
}

// Generate returns rule-based recommendations for the supplied signals.
func (s *Service) Generate(signals Signals) []string {
	if s == nil || s.engine == nil {
		return []string{"Continue the current plan and monitor symptoms"}
	}
	return s.engine.Generate(signals)
}
