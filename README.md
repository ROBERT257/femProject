# femProject

## Running the app

1. Install Ollama on Windows and start it on the host machine.
2. Pull the model on the host with `ollama pull llama3`.
3. Make sure Ollama is listening on `0.0.0.0:11434` or otherwise reachable from Docker containers.
4. Start PostgreSQL and the Go API with `docker compose up -d db api`.
5. If you prefer local development, run the Go API from the project root with `go run .` or `go run . -port 8080`.

## Email delivery

The Dockerized API sends emails through Mailhog at `mailhog:1025`.
If you run the API directly on Windows, keep SMTP pointed at `127.0.0.1:1025` while Mailhog is running.

## Ollama endpoint

The backend connects to `http://host.docker.internal:11434` in Dockerized development and uses `llama3:latest`.
If you run the API directly on Windows, `http://localhost:11434` also works.

## First APIs

- `POST /api/ai/chat`
- `POST /api/recommendations/generate`
- `POST /api/wearables/sync`
- `GET /api/wearables/{userId}`

The dashboard runs on `http://127.0.0.1:5173/` and proxies rehabilitation API calls to the Go backend on port `8080`.