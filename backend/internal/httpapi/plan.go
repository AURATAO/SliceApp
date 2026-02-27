package httpapi

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"time"

	"sliceapp-backend/internal/ai"
	"sliceapp-backend/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

func clampInt(v, minV, maxV int) int {
	if v < minV {
		return minV
	}
	if v > maxV {
		return maxV
	}
	return v
}

type CreatePlanRequest struct {
	Title        string `json:"title"`
	Days         int    `json:"days"`
	DailyMinutes int    `json:"daily_minutes"`
	// 之後會加：deadline, current_progress, constraints...
}

type PlanDayStep struct {
	Title       string `json:"title"`
	Minutes     int    `json:"minutes"`
	Deliverable string `json:"deliverable"`
	DoneDef     string `json:"done_definition"`
}

type PlanDay struct {
	DayNumber int           `json:"day_number"`
	Focus     string        `json:"focus"`
	Steps     []PlanDayStep `json:"steps"`
	IsDone    bool          `json:"is_done"`
}

type CreatePlanResponse struct {
	PlanID string    `json:"plan_id"`
	Title  string    `json:"title"`
	Days   int       `json:"days"`
	Items  []PlanDay `json:"items"`
}

func handleCreatePlan(db *pgxpool.Pool, cfg config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreatePlanRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json body", http.StatusBadRequest)
			return
		}
		if req.Title == "" || req.Days <= 0 || req.Days > 60 || req.DailyMinutes <= 0 {
			http.Error(w, "invalid input", http.StatusBadRequest)
			return
		}

		// Product rule: only plan next 7 days max (matches your AI rules)
		planDays := req.Days
		if planDays > 7 {
			planDays = 7
		}

		// ---- 1) Produce meta + plan items (fake or real) ----
		type metaPayload struct {
			SplitterQuote     string   `json:"splitter_quote"`
			Mode              string   `json:"mode"`
			GoalType          string   `json:"goal_type"`
			OriginalGoal      string   `json:"original_goal"`
			FinalGoal         string   `json:"final_goal"`
			Changed           bool     `json:"changed"`
			WhyThisAdjustment string   `json:"why_this_adjustment"`
			SuccessRule       string   `json:"success_rule"`
			Assumptions       []string `json:"assumptions"`
			RiskNotes         []string `json:"risk_notes"`
		}

		type planPayload struct {
			ID           string    `json:"id"`
			Title        string    `json:"title"`
			Days         int       `json:"days"`
			DailyMinutes int       `json:"daily_minutes"`
			CreatedAt    time.Time `json:"created_at,omitempty"`
			Items        []PlanDay `json:"items"`
		}

		var meta metaPayload
		var plan planPayload

		if cfg.UseFakeAI {
			// ✅ Fake splitter output (no cost)
			meta = metaPayload{
				SplitterQuote:     "Small wins compound faster than perfect plans.",
				Mode:              "normal",
				GoalType:          "Build",
				OriginalGoal:      req.Title,
				FinalGoal:         req.Title,
				Changed:           false,
				WhyThisAdjustment: "",
				SuccessRule:       "Do 1 = pass. Do 2 = bonus. Do 3 = hero.",
				Assumptions:       []string{},
				RiskNotes:         []string{"If time gets tight, only do [BAD DAY] to keep the streak alive."},
			}

			// minutes allocation (match your AI rule idea)
			D := req.DailyMinutes
			bad := clampInt(int(math.Round(float64(D)*0.15)), 3, 10)
			mom := clampInt(int(math.Round(float64(D)*0.25)), 10, 25)
			core := D - bad - mom
			if core < 10 {
				need := 10 - core
				mom -= need
				if mom < 10 {
					mom = 10
				}
				core = D - bad - mom
			}

			items := make([]PlanDay, 0, planDays)
			for i := 1; i <= planDays; i++ {
				items = append(items, PlanDay{
					DayNumber: i,
					Focus:     "",
					Steps: []PlanDayStep{
						{
							Title:       "[CORE] Ship one meaningful chunk",
							Minutes:     core,
							Deliverable: "1 tangible output (commit / doc / file) for Day " + strconv.Itoa(i),
							DoneDef:     "You can point to it and say 'this exists now'.",
						},
						{
							Title:       "[MOMENTUM] Prep the next move",
							Minutes:     mom,
							Deliverable: "A short note: next step + blockers",
							DoneDef:     "A note exists with 1 next step and 1 blocker.",
						},
						{
							Title:       "[BAD DAY] Keep the streak alive",
							Minutes:     bad,
							Deliverable: "A 1-line progress log",
							DoneDef:     "One line written: what you touched today.",
						},
					},
				})
			}

			plan = planPayload{
				Title:        req.Title,
				Days:         planDays,
				DailyMinutes: req.DailyMinutes,
				Items:        items,
			}
		} else {
			// ✅ Real AI (costs money)
			aiClient := ai.NewClient(cfg.OpenAIKey, cfg.OpenAIModel)

			ctx, cancel := context.WithTimeout(r.Context(), 40*time.Second)
			defer cancel()

			tf := planDays
			dm := req.DailyMinutes
			out, err := aiClient.GenerateSplitter(ctx, req.Title, &tf, &dm)
			if err != nil {
				http.Error(w, "ai generation failed: "+err.Error(), http.StatusBadGateway)
				return
			}

			// Map meta
			meta = metaPayload{
				SplitterQuote:     out.Meta.SplitterQuote,
				Mode:              out.Meta.Mode,
				GoalType:          out.Meta.GoalType,
				OriginalGoal:      out.Meta.OriginalGoal,
				FinalGoal:         out.Meta.FinalGoal,
				Changed:           out.Meta.Changed,
				WhyThisAdjustment: out.Meta.WhyThisAdjustment,
				SuccessRule:       out.Meta.SuccessRule,
				Assumptions:       out.Meta.Assumptions,
				RiskNotes:         out.Meta.RiskNotes,
			}

			// Map plan (note: use AI final title)
			items := make([]PlanDay, 0, len(out.Plan.Items))
			for _, d := range out.Plan.Items {
				steps := make([]PlanDayStep, 0, len(d.Steps))
				for _, s := range d.Steps {
					steps = append(steps, PlanDayStep{
						Title:       s.Title,
						Minutes:     s.Minutes,
						Deliverable: s.Deliverable,
						DoneDef:     s.DoneDefinition,
					})
				}
				items = append(items, PlanDay{
					DayNumber: d.DayNumber,
					Focus:     d.Focus,
					Steps:     steps,
				})
			}

			plan = planPayload{
				Title:        out.Plan.Title,
				Days:         out.Plan.Days,
				DailyMinutes: out.Plan.DailyMinutes,
				Items:        items,
			}
		}

		// ---- 2) DB write (if db connected) ----
		planID := ""
		createdAt := time.Time{}

		uid, ok := userIDFromCtx(r.Context())
		if !ok {
			http.Error(w, "missing user", http.StatusUnauthorized)
			return
		}

		if db != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
			defer cancel()

			tx, err := db.Begin(ctx)
			if err != nil {
				http.Error(w, "begin tx failed", http.StatusInternalServerError)
				return
			}
			defer func() { _ = tx.Rollback(ctx) }()

			// 0) Ensure user exists (for FK plans.user_id -> users.id)
			_, err = tx.Exec(ctx, `
			insert into public.users (id)
			values ($1)
			on conflict (id) do nothing
			`, uid)
			if err != nil {
				http.Error(w, "ensure user failed", http.StatusInternalServerError)
				return
			}

			// IMPORTANT: store final title (plan.Title), not req.Title
			err = tx.QueryRow(ctx, `
    insert into public.plans (user_id, title, days, daily_minutes)
    values ($1, $2, $3, $4)
    returning id, created_at
  `, uid, plan.Title, plan.Days, plan.DailyMinutes).Scan(&planID, &createdAt)
			if err != nil {
				http.Error(w, "insert plan failed", http.StatusInternalServerError)
				return
			}

			for _, d := range plan.Items {
				stepsJSON, _ := json.Marshal(d.Steps)
				_, err = tx.Exec(ctx, `
      insert into public.plan_days (plan_id, day_number, focus, steps)
      values ($1,$2,$3,$4)
    `, planID, d.DayNumber, d.Focus, stepsJSON)
				if err != nil {
					http.Error(w, "insert plan_days failed", http.StatusInternalServerError)
					return
				}
			}

			if err := tx.Commit(ctx); err != nil {
				http.Error(w, "commit failed", http.StatusInternalServerError)
				return
			}
		}

		plan.ID = planID
		if !createdAt.IsZero() {
			plan.CreatedAt = createdAt
		}

		// ---- 3) Response: meta + plan (frontend can show modal immediately) ----
		resp := map[string]any{
			"meta": meta,
			"plan": plan,
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}
}
