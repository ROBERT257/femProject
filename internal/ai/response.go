package ai

// AIResponse is the structured payload returned by the model and API.
type AIResponse struct {
	Response        string   `json:"response"`
	Recommendations []string `json:"recommendations"`
	RiskLevel       string   `json:"risk_level"`
}

// ChatResult is kept as a service-facing alias for the structured response.
type ChatResult = AIResponse

// GenerationResult captures the raw generation output plus Ollama metadata.
type GenerationResult struct {
	Response          string
	Model             string
	PromptTokens      int
	CompletionTokens  int
	TotalTokens       int
	DurationMillis    int64
}