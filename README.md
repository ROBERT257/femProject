# femProject

## Running the app

1. Start PostgreSQL with `docker compose up -d db`.
2. Start the Go API from the project root with `go run . -port 8080`.
3. Start the React frontend from `frontend/` with `npm install` once, then `npm run dev`.

The dashboard runs on `http://127.0.0.1:5173/` and proxies workout API calls to the Go backend on port `8080`.