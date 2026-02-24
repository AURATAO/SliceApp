package httpapi

import (
	"net/http"
	"sliceapp-backend/internal/config"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool, cfg config.Config) http.Handler {
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	r.Get("/plans", handleListPlans(db))
	r.Get("/plans/{id}", handleGetPlan(db))
	r.Post("/plan", handleCreatePlan(db, cfg))

	r.Patch("/plans/{id}/days/{day}", handlePatchPlanDay(db))
	r.Patch("/plans/{id}/days/{dayNumber}", handleUpdatePlanDay(db))
	r.Delete("/plans/{id}", handleDeletePlan(db))

	return r
}
