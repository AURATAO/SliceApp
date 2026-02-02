package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

type Client struct {
	APIKey string
	Model  string
	HTTP   *http.Client
}

func NewClient(apiKey, model string) *Client {
	return &Client{
		APIKey: apiKey,
		Model:  model,
		HTTP: &http.Client{
			Timeout: 35 * time.Second,
		},
	}
}

type PlanDayStep struct {
	Title          string `json:"title"`
	Minutes        int    `json:"minutes"`
	DoneDefinition string `json:"done_definition"`
}

type PlanDay struct {
	DayNumber int           `json:"day_number"`
	Focus     string        `json:"focus"`
	Steps     []PlanDayStep `json:"steps"`
}

type planSchemaResponse struct {
	Days []PlanDay `json:"days"`
}

// ---- OpenAI Responses API payload ----

type responsesReq struct {
	Model        string     `json:"model"`
	Instructions string     `json:"instructions,omitempty"`
	Input        any        `json:"input"`
	Text         textConfig `json:"text"`
	Temperature  *float64   `json:"temperature,omitempty"`
}

type textConfig struct {
	Format jsonSchemaFormat `json:"format"`
}

type jsonSchemaFormat struct {
	Type   string         `json:"type"`   // "json_schema"
	Name   string         `json:"name"`   // e.g. "slice_plan"
	Strict bool           `json:"strict"` // true
	Schema map[string]any `json:"schema"`
}

type responsesResp struct {
	Output []struct {
		Type    string `json:"type"` // "message"
		Role    string `json:"role"`
		Content []struct {
			Type string `json:"type"` // "output_text"
			Text string `json:"text"`
		} `json:"content"`
	} `json:"output"`
	Error any `json:"error"`
}

func (c *Client) GeneratePlan(ctx context.Context, title string, days int, dailyMinutes int) ([]PlanDay, error) {
	if c.APIKey == "" {
		return nil, errors.New("OPENAI_API_KEY is empty")
	}
	if c.Model == "" {
		c.Model = "gpt-5.2"
	}

	// JSON schema for Structured Outputs (Responses API "text.format")
	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"days": map[string]any{
				"type":     "array",
				"minItems": days,
				"maxItems": days,
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"day_number": map[string]any{"type": "integer"},
						"focus":      map[string]any{"type": "string"},
						"steps": map[string]any{
							"type":     "array",
							"minItems": 1,
							"maxItems": 5,
							"items": map[string]any{
								"type": "object",
								"properties": map[string]any{
									"title":           map[string]any{"type": "string"},
									"minutes":         map[string]any{"type": "integer"},
									"done_definition": map[string]any{"type": "string"},
								},
								"required":             []string{"title", "minutes", "done_definition"},
								"additionalProperties": false,
							},
						},
					},
					"required":             []string{"day_number", "focus", "steps"},
					"additionalProperties": false,
				},
			},
		},
		"required":             []string{"days"},
		"additionalProperties": false,
	}

	instructions := `You are Slice, a task breakdown planner.
Return ONLY JSON that matches the provided JSON Schema.

Rules:
- Produce exactly N days (1..N).
- Each day has 1–5 steps.
- Steps must be concrete and doable.
- Total step minutes per day should be <= daily_minutes.
- day_number must be sequential starting at 1.`

	userInput := map[string]any{
		"goal_title":    title,
		"days":          days,
		"daily_minutes": dailyMinutes,
		"tone":          "clean, actionable, minimal",
	}

	reqBody := responsesReq{
		Model:        c.Model,
		Instructions: instructions,
		Input: []any{
			map[string]any{"role": "user", "content": userInput},
		},
		Text: textConfig{
			Format: jsonSchemaFormat{
				Type:   "json_schema",
				Name:   "slice_plan",
				Strict: true,
				Schema: schema,
			},
		},
	}

	b, _ := json.Marshal(reqBody)
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/responses", bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("openai http status not ok")
	}

	var rr responsesResp
	if err := json.NewDecoder(resp.Body).Decode(&rr); err != nil {
		return nil, err
	}

	// Extract the first output_text
	var jsonText string
	for _, out := range rr.Output {
		for _, c := range out.Content {
			if c.Type == "output_text" && c.Text != "" {
				jsonText = c.Text
				break
			}
		}
		if jsonText != "" {
			break
		}
	}
	if jsonText == "" {
		return nil, errors.New("no output_text from openai")
	}

	var parsed planSchemaResponse
	if err := json.Unmarshal([]byte(jsonText), &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Days) != days {
		return nil, errors.New("ai returned wrong number of days")
	}

	return parsed.Days, nil
}
