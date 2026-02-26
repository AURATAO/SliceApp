package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PatchDayRequest struct {
	IsDone *bool `json:"is_done"`
}

func handlePatchPlanDay(db *pgxpool.Pool) http.HandlerFunc {
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
		dayStr := chi.URLParam(r, "day")
		if planID == "" || dayStr == "" {
			http.Error(w, "missing params", http.StatusBadRequest)
			return
		}

		dayNumber, err := strconv.Atoi(dayStr)
		if err != nil || dayNumber <= 0 || dayNumber > 365 {
			http.Error(w, "invalid day_number", http.StatusBadRequest)
			return
		}

		var req PatchDayRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json body", http.StatusBadRequest)
			return
		}
		if req.IsDone == nil {
			http.Error(w, "missing is_done", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
		defer cancel()

		cmd, err := db.Exec(ctx, `
			update public.plan_days
			set is_done = $1
			where plan_id = $2 and day_number = $3 nd exists (
      select 1 from public.plans p
      where p.id = d.plan_id and p.user_id = $4
    )
		`, *req.IsDone, planID, dayNumber, uid)
		if err != nil {
			http.Error(w, "update failed", http.StatusInternalServerError)
			return
		}
		if cmd.RowsAffected() == 0 {
			http.Error(w, "plan_day not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":         true,
			"plan_id":    planID,
			"day_number": dayNumber,
			"is_done":    *req.IsDone,
		})
	}
}
