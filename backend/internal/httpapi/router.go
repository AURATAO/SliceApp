package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	r.Get("/plans", handleListPlans(db))
	r.Get("/plans/{id}", handleGetPlan(db))
	r.Post("/plan", handleCreatePlan(db))
	r.Patch("/plans/{id}/days/{day}", handlePatchPlanDay(db))

	return r
}
