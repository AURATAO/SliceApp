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

	// No user required
	r.Post("/auth/anonymous", handleAnonymousUser(db))

	// User required
	r.Group(func(pr chi.Router) {
		pr.Use(requireUserID)

		pr.Get("/plans", handleListPlans(db))
		pr.Get("/plans/{id}", handleGetPlan(db))
		pr.Post("/plan", handleCreatePlan(db, cfg))

		pr.Patch("/plans/{id}/days/{day}", handlePatchPlanDay(db))
		pr.Patch("/plans/{id}/days/{dayNumber}", handleUpdatePlanDay(db))
		pr.Delete("/plans/{id}", handleDeletePlan(db))
	})

	return r
}
