package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func handleDeletePlan(db *pgxpool.Pool) http.HandlerFunc {
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

		// If you have ON DELETE CASCADE on plan_days.plan_id,
		// deleting from plans will automatically delete plan_days.
		tag, err := db.Exec(ctx, `
			delete from public.plans
			 where id = $1 and user_id = $2
		`, planID, uid)

		if err != nil {
			http.Error(w, "delete failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if tag.RowsAffected() == 0 {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":      true,
			"plan_id": planID,
		})
	}
}
