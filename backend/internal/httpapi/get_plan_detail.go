package httpapi

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PlanDetailResponse struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Days         int       `json:"days"`
	DailyMinutes int       `json:"daily_minutes"`
	CreatedAt    time.Time `json:"created_at"`
	Items        []PlanDay `json:"items"`
}

func handleGetPlan(db *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if db == nil {
			http.Error(w, "db not connected", http.StatusServiceUnavailable)
			return
		}
		uid, ok := userIDFromCtx(r.Context())
		if !ok {
			http.Error(w, "missing user", http.StatusUnauthorized)
			return
		}

		planID := chi.URLParam(r, "id")
		if planID == "" {
			http.Error(w, "missing id", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		var resp PlanDetailResponse
		err := db.QueryRow(ctx, `
			select id, title, days, daily_minutes, created_at
			from public.plans
			  where id = $1 and user_id = $2
		`, planID, uid).Scan(&resp.ID, &resp.Title, &resp.Days, &resp.DailyMinutes, &resp.CreatedAt)

		if err != nil {
			http.Error(w, "plan not found", http.StatusNotFound)
			return
		}

		rows, err := db.Query(ctx, `
		select d.day_number, d.focus, d.steps, d.is_done
		from public.plan_days d
		join public.plans p on p.id = d.plan_id
		where d.plan_id = $1 and p.user_id = $2
		order by d.day_number asc
		`, planID, uid)
		if err != nil {
			log.Printf("query plan_days failed: %v", err)
			http.Error(w, "query plan_days failed", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		items := make([]PlanDay, 0)
		for rows.Next() {
			var dayNumber int
			var focus string
			var stepsRaw []byte
			var isDone bool

			if err := rows.Scan(&dayNumber, &focus, &stepsRaw, &isDone); err != nil {
				http.Error(w, "scan failed", http.StatusInternalServerError)
				return
			}

			var steps []PlanDayStep
			_ = json.Unmarshal(stepsRaw, &steps)

			items = append(items, PlanDay{
				DayNumber: dayNumber,
				Focus:     focus,
				Steps:     steps,
				IsDone:    isDone,
			})
		}

		resp.Items = items

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}
}
