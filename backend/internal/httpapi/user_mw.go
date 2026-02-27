package httpapi

import (
	"context"
	"log"
	"net/http"

	"github.com/google/uuid"
)

type ctxKey int

const userIDKey ctxKey = iota

func userIDFromCtx(ctx context.Context) (uuid.UUID, bool) {
	v := ctx.Value(userIDKey)
	id, ok := v.(uuid.UUID)
	return id, ok
}

func requireUserID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get("X-User-Id")
		if raw == "" {
			http.Error(w, "missing X-User-Id", http.StatusUnauthorized)
			return
		}
		id, err := uuid.Parse(raw)
		if err != nil {
			http.Error(w, "invalid X-User-Id", http.StatusBadRequest)
			return
		}

		log.Printf("X-User-Id received: %q", raw)

		ctx := context.WithValue(r.Context(), userIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
