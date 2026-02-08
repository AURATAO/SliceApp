package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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

// -------------------- Domain Types (align with app plan_days JSON) --------------------

type PlanDayStep struct {
	Title          string `json:"title"`
	Minutes        int    `json:"minutes"`
	Deliverable    string `json:"deliverable"`
	DoneDefinition string `json:"done_definition"`
}

type PlanDay struct {
	DayNumber int           `json:"day_number"`
	Focus     string        `json:"focus"`
	Steps     []PlanDayStep `json:"steps"`
}

// meta + plan output (AI structured output)
type SplitterMeta struct {
	SplitterQuote     string   `json:"splitter_quote"`
	Mode              string   `json:"mode"`      // normal | de_scope
	GoalType          string   `json:"goal_type"` // Learn|Build|Create|Improve|Organize|Social
	OriginalGoal      string   `json:"original_goal"`
	FinalGoal         string   `json:"final_goal"`
	Changed           bool     `json:"changed"`
	WhyThisAdjustment string   `json:"why_this_adjustment"`
	SuccessRule       string   `json:"success_rule"`
	Assumptions       []string `json:"assumptions"`
	RiskNotes         []string `json:"risk_notes"`
}

type SplitterPlan struct {
	Title        string    `json:"title"`
	Days         int       `json:"days"`
	DailyMinutes int       `json:"daily_minutes"`
	Items        []PlanDay `json:"items"`
}

type SplitterResponse struct {
	Meta SplitterMeta `json:"meta"`
	Plan SplitterPlan `json:"plan"`
}

// -------------------- OpenAI Responses API payload --------------------

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
	Name   string         `json:"name"`   // e.g. "slice_splitter"
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

// -------------------- Internal helpers --------------------

func (c *Client) doResponses(ctx context.Context, reqBody responsesReq) (string, error) {
	b, _ := json.Marshal(reqBody)

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/responses", bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai http %d: %s", resp.StatusCode, string(body))
	}

	var rr responsesResp
	if err := json.NewDecoder(resp.Body).Decode(&rr); err != nil {
		return "", err
	}

	// Extract first output_text
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
		return "", errors.New("no output_text from openai")
	}

	return jsonText, nil
}

func splitterSchema(days int) map[string]any {
	// NOTE: Strict schema matching your frontend/backend:
	// - meta required
	// - plan required
	// - plan.items length == days
	// - steps length == 3
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"meta": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"splitter_quote":      map[string]any{"type": "string"},
					"mode":                map[string]any{"type": "string", "enum": []any{"normal", "de_scope"}},
					"goal_type":           map[string]any{"type": "string", "enum": []any{"Learn", "Build", "Create", "Improve", "Organize", "Social"}},
					"original_goal":       map[string]any{"type": "string"},
					"final_goal":          map[string]any{"type": "string"},
					"changed":             map[string]any{"type": "boolean"},
					"why_this_adjustment": map[string]any{"type": "string"},
					"success_rule":        map[string]any{"type": "string"},
					"assumptions": map[string]any{
						"type":     "array",
						"minItems": 0,
						"maxItems": 3,
						"items":    map[string]any{"type": "string"},
					},
					"risk_notes": map[string]any{
						"type":     "array",
						"minItems": 1,
						"maxItems": 3,
						"items":    map[string]any{"type": "string"},
					},
				},
				"required": []string{
					"splitter_quote", "mode", "goal_type",
					"original_goal", "final_goal", "changed",
					"why_this_adjustment", "success_rule",
					"assumptions", "risk_notes",
				},
				"additionalProperties": false,
			},
			"plan": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"title":         map[string]any{"type": "string"},
					"days":          map[string]any{"type": "integer"},
					"daily_minutes": map[string]any{"type": "integer"},
					"items": map[string]any{
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
									"minItems": 3,
									"maxItems": 3,
									"items": map[string]any{
										"type": "object",
										"properties": map[string]any{
											"title":           map[string]any{"type": "string"},
											"minutes":         map[string]any{"type": "integer"},
											"deliverable":     map[string]any{"type": "string"},
											"done_definition": map[string]any{"type": "string"},
										},
										"required":             []string{"title", "minutes", "deliverable", "done_definition"},
										"additionalProperties": false,
									},
								},
							},
							"required":             []string{"day_number", "focus", "steps"},
							"additionalProperties": false,
						},
					},
				},
				"required":             []string{"title", "days", "daily_minutes", "items"},
				"additionalProperties": false,
			},
		},
		"required":             []string{"meta", "plan"},
		"additionalProperties": false,
	}
}
