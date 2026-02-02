package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PlanListItem struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Days         int       `json:"days"`
	DailyMinutes int       `json:"daily_minutes"`
	CreatedAt    time.Time `json:"created_at"`
}

func handleListPlans(db *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if db == nil {
			http.Error(w, "db not connected", http.StatusServiceUnavailable)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
		defer cancel()

		rows, err := db.Query(ctx, `
			select id, title, days, daily_minutes, created_at
			from public.plans
			order by created_at desc
			limit 50
		`)
		if err != nil {
			http.Error(w, "query failed", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		out := make([]PlanListItem, 0)
		for rows.Next() {
			var it PlanListItem
			if err := rows.Scan(&it.ID, &it.Title, &it.Days, &it.DailyMinutes, &it.CreatedAt); err != nil {
				http.Error(w, "scan failed", http.StatusInternalServerError)
				return
			}
			out = append(out, it)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"plans": out})
	}
}
