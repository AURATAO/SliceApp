package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"sliceapp-backend/internal/ai"
	"sliceapp-backend/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CreatePlanRequest struct {
	Title        string `json:"title"`
	Days         int    `json:"days"`
	DailyMinutes int    `json:"daily_minutes"`
	// 之後會加：deadline, current_progress, constraints...
}

type PlanDayStep struct {
	Title   string `json:"title"`
	Minutes int    `json:"minutes"`
	DoneDef string `json:"done_definition"`
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

func handleCreatePlan(db *pgxpool.Pool) http.HandlerFunc {
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

		cfg := config.Load()

		// ---- 1) 產生 items：依 USE_FAKE_AI 決定走假資料 or 走 OpenAI ----
		var items []PlanDay

		if cfg.UseFakeAI {
			// ✅ 假資料（不花錢）
			items = make([]PlanDay, 0, req.Days)
			for i := 1; i <= req.Days; i++ {
				items = append(items, PlanDay{
					DayNumber: i,
					Focus:     "Focus for day " + strconv.Itoa(i),
					Steps: []PlanDayStep{
						{Title: "Define today's micro-goal", Minutes: 5, DoneDef: "Written down in one sentence"},
						{Title: "Do the main task", Minutes: max(1, req.DailyMinutes-10), DoneDef: "Produced a tangible output"},
						{Title: "Quick review & prep tomorrow", Minutes: 5, DoneDef: "Next step decided"},
					},
				})
			}
		} else {
			// ✅ 真 AI（會花錢）
			aiClient := ai.NewClient(cfg.OpenAIKey, cfg.OpenAIModel)

			ctx, cancel := context.WithTimeout(r.Context(), 40*time.Second)
			defer cancel()

			daysFromAI, err := aiClient.GeneratePlan(ctx, req.Title, req.Days, req.DailyMinutes)
			if err != nil {
				http.Error(w, "ai generation failed: "+err.Error(), http.StatusBadGateway)
				return
			}

			// 把 AI 結果轉回你原本的 PlanDay / Step 結構
			items = make([]PlanDay, 0, len(daysFromAI))
			for _, d := range daysFromAI {
				steps := make([]PlanDayStep, 0, len(d.Steps))
				for _, s := range d.Steps {
					steps = append(steps, PlanDayStep{
						Title:   s.Title,
						Minutes: s.Minutes,
						DoneDef: s.DoneDefinition,
					})
				}
				items = append(items, PlanDay{
					DayNumber: d.DayNumber,
					Focus:     d.Focus,
					Steps:     steps,
				})
			}
		}

		// DB 寫入（如果沒連上 DB，仍可回資料）
		planID := ""
		if db != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
			defer cancel()

			// user_id 先留空（之後串 Supabase Auth 再補）
			err := db.QueryRow(ctx,
				`insert into public.plans (title, days, daily_minutes) values ($1,$2,$3) returning id`,
				req.Title, req.Days, req.DailyMinutes,
			).Scan(&planID)
			if err == nil {
				// insert plan_days
				for _, d := range items {
					stepsJSON, _ := json.Marshal(d.Steps)
					_, _ = db.Exec(ctx,
						`insert into public.plan_days (plan_id, day_number, focus, steps) values ($1,$2,$3,$4)`,
						planID, d.DayNumber, d.Focus, stepsJSON,
					)
				}
			}
		}

		resp := CreatePlanResponse{
			PlanID: planID,
			Title:  req.Title,
			Days:   req.Days,
			Items:  items,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
