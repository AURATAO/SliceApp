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

type UpdatePlanDayRequest struct {
	Focus  *string          `json:"focus,omitempty"`
	Steps  json.RawMessage  `json:"steps,omitempty"`   // expecting JSON array
	IsDone *bool            `json:"is_done,omitempty"`
}

func handleUpdatePlanDay(db *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if db == nil {
			http.Error(w, "db not connected", http.StatusServiceUnavailable)
			return
		}

		planID := chi.URLParam(r, "id")
		if planID == "" {
			http.Error(w, "missing id", http.StatusBadRequest)
			return
		}

		dayStr := chi.URLParam(r, "dayNumber")
		dayNumber, err := strconv.Atoi(dayStr)
		if err != nil || dayNumber <= 0 {
			http.Error(w, "invalid dayNumber", http.StatusBadRequest)
			return
		}

		var req UpdatePlanDayRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json body", http.StatusBadRequest)
			return
		}

		// If nothing provided, do nothing
		if req.Focus == nil && req.Steps == nil && req.IsDone == nil {
			http.Error(w, "nothing to update", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		// Validate steps JSON if provided (must be array)
		if req.Steps != nil {
			var tmp []any
			if err := json.Unmarshal(req.Steps, &tmp); err != nil {
				http.Error(w, "steps must be a json array", http.StatusBadRequest)
				return
			}
		}

		// Build update dynamically (patch semantics)
		// We'll use COALESCE style by passing current value when nil isn't updated.
		// But to keep it simple, do 3 independent updates depending on fields.

		tx, err := db.Begin(ctx)
		if err != nil {
			http.Error(w, "begin tx failed", http.StatusInternalServerError)
			return
		}
		defer func() { _ = tx.Rollback(ctx) }()

		if req.Focus != nil {
			_, err = tx.Exec(ctx, `
				update public.plan_days
				set focus = $1
				where plan_id = $2 and day_number = $3
			`, *req.Focus, planID, dayNumber)
			if err != nil {
				http.Error(w, "update focus failed", http.StatusInternalServerError)
				return
			}
		}

		if req.Steps != nil {
			_, err = tx.Exec(ctx, `
				update public.plan_days
				set steps = $1
				where plan_id = $2 and day_number = $3
			`, req.Steps, planID, dayNumber)
			if err != nil {
				http.Error(w, "update steps failed", http.StatusInternalServerError)
				return
			}
		}

		if req.IsDone != nil {
			_, err = tx.Exec(ctx, `
				update public.plan_days
				set is_done = $1
				where plan_id = $2 and day_number = $3
			`, *req.IsDone, planID, dayNumber)
			if err != nil {
				http.Error(w, "update is_done failed", http.StatusInternalServerError)
				return
			}
		}

		if err := tx.Commit(ctx); err != nil {
			http.Error(w, "commit failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":         true,
			"plan_id":    planID,
			"day_number": dayNumber,
		})
	}
}
