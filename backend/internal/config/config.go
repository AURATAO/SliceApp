package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string

	UseFakeAI   bool
	OpenAIKey   string
	OpenAIModel string
}

func Load() Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = "gpt-5.2"
	}

	useFake := strings.ToLower(os.Getenv("USE_FAKE_AI")) == "true"

	return Config{
		Port:        port,
		DatabaseURL: os.Getenv("DATABASE_URL"),
		UseFakeAI:   useFake,
		OpenAIKey:   os.Getenv("OPENAI_API_KEY"),
		OpenAIModel: model,
	}
}
