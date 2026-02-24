package main

import (
	"log"
	"net/http"
	"time"

	"github.com/joho/godotenv"

	"sliceapp-backend/internal/config"
	"sliceapp-backend/internal/db"
	"sliceapp-backend/internal/httpapi"
)

func main() {

	_ = godotenv.Load()
	cfg := config.Load()

	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("DB connect failed: %v", err) // ✅ 直接停止，別讓 API 半死不活
	}
	defer pool.Close()

	r := httpapi.NewRouter(pool, cfg)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("API listening on http://0.0.0.0:%s", cfg.Port)
	log.Fatal(srv.ListenAndServe())
}
