package ai

import (
	"context"
	"encoding/json"
	"errors"
)

func (c *Client) GenerateSplitter(ctx context.Context, userGoal string, timeframeDays *int, dailyMinutes *int) (*SplitterResponse, error) {
	if c.APIKey == "" {
		return nil, errors.New("OPENAI_API_KEY is empty")
	}
	if c.Model == "" {
		c.Model = "gpt-5.2"
	}

	// Server-side defaults (avoid AI guessing)
	days := 7
	if timeframeDays != nil && *timeframeDays > 0 {
		if *timeframeDays <= 7 {
			days = *timeframeDays
		} else {
			days = 7
		}
	}

	dm := 30
	if dailyMinutes != nil && *dailyMinutes > 0 {
		dm = *dailyMinutes
	}

	// Build prompt from your template function
	prompt := BuildSplitterPrompt(userGoal, timeframeDays, &dm)

	// Schema for structured outputs
	schema := splitterSchema(days)

	// Keep instructions short; main rules live in prompt
	instructions := `Return ONLY valid JSON that matches the provided JSON Schema. No markdown. No extra text.`

	// We pass prompt as part of user content (simple & reliable)

	reqBody := responsesReq{
		Model:        c.Model,
		Instructions: instructions,
		Input: []any{
			map[string]any{
				"role":    "user",
				"content": prompt, // ✅ string
			},
		},
		Text: textConfig{
			Format: jsonSchemaFormat{
				Type:   "json_schema",
				Name:   "slice_splitter",
				Strict: true,
				Schema: schema,
			},
		},
	}

	jsonText, err := c.doResponses(ctx, reqBody)
	if err != nil {
		return nil, err
	}

	var parsed SplitterResponse
	if err := json.Unmarshal([]byte(jsonText), &parsed); err != nil {
		return nil, errors.New("ai returned invalid json: " + err.Error())
	}

	// Basic validation (protect DB)
	if parsed.Plan.Days != days {
		return nil, errors.New("ai returned wrong plan.days")
	}
	if parsed.Plan.DailyMinutes != dm {
		return nil, errors.New("ai returned wrong plan.daily_minutes")
	}
	if parsed.Plan.Title == "" || parsed.Meta.SplitterQuote == "" {
		return nil, errors.New("ai response missing required fields")
	}
	if len(parsed.Plan.Items) != days {
		return nil, errors.New("ai returned wrong number of plan.items")
	}
	for i, d := range parsed.Plan.Items {
		if d.DayNumber != i+1 {
			return nil, errors.New("day_number must start at 1 and be sequential")
		}
		if len(d.Steps) != 3 {
			return nil, errors.New("each day must have exactly 3 steps")
		}
		for _, s := range d.Steps {
			if s.Title == "" || s.Deliverable == "" || s.DoneDefinition == "" || s.Minutes <= 0 {
				return nil, errors.New("step missing required fields")
			}
		}
	}

	return &parsed, nil
}
