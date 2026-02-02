package main

import (
	"log"
	"net/http"
	"time"

	"sliceapp-backend/internal/config"
	"sliceapp-backend/internal/db"
	"sliceapp-backend/internal/httpapi"
)

func main() {
	cfg := config.Load()

	// DB 暫時可不連（DATABASE_URL 空也能跑）
	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Printf("DB not connected: %v", err)
	}
	defer func() {
		if pool != nil {
			pool.Close()
		}
	}()

	r := httpapi.NewRouter(pool)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("API listening on http://localhost:%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}
