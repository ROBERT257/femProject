package ai

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

// OllamaClient wraps the Ollama connection settings.
type OllamaClient struct {
	BaseURL    string
	Model      string
	Timeout    time.Duration
	httpClient *http.Client
}

// NewOllamaClient creates a client configuration for the local Ollama server.
func NewOllamaClient(baseURL, model string, timeout time.Duration) *OllamaClient {
	if model == "" {
		model = "phi3"
	}
	return &OllamaClient{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		Model:      model,
		Timeout:    timeout,
		httpClient: &http.Client{Timeout: timeout},
	}
}

// PromptPayload is the request body sent to Ollama.
type PromptPayload struct {
	Model   string         `json:"model"`
	Prompt  string         `json:"prompt"`
	Stream  bool           `json:"stream"`
	Options map[string]any `json:"options,omitempty"`
}

// Generate sends a prompt to Ollama and returns the generated text plus metadata.
func (c *OllamaClient) Generate(ctx context.Context, prompt string) (*GenerationResult, error) {
	startedAt := time.Now()
	requestBody := PromptPayload{
		Model:  c.Model,
		Prompt: prompt,
		Stream: false,
		Options: map[string]any{
			"temperature": 0,
			"top_p":       0.1,
			"num_predict": 128,
		},
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("marshal ollama request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+"/api/generate", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build ollama request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call ollama: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read ollama response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if len(responseBody) > 0 {
			return nil, fmt.Errorf("ollama error: %s", strings.TrimSpace(string(responseBody)))
		}
		return nil, fmt.Errorf("ollama returned status %d", resp.StatusCode)
	}

	var payload struct {
		Model           string `json:"model"`
		Response        string `json:"response"`
		Error           string `json:"error"`
		PromptEvalCount int    `json:"prompt_eval_count"`
		EvalCount       int    `json:"eval_count"`
		TotalDuration   int64  `json:"total_duration"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, fmt.Errorf("decode ollama response: %w", err)
	}
	if payload.Error != "" {
		return nil, fmt.Errorf("ollama error: %s", payload.Error)
	}

	result := &GenerationResult{
		Response:         strings.TrimSpace(payload.Response),
		Model:            strings.TrimSpace(payload.Model),
		PromptTokens:     payload.PromptEvalCount,
		CompletionTokens: payload.EvalCount,
		TotalTokens:      payload.PromptEvalCount + payload.EvalCount,
		DurationMillis:   time.Since(startedAt).Milliseconds(),
	}
	if result.Model == "" {
		result.Model = c.Model
	}
	return result, nil
}
