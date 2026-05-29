package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/ROBERT257/femProject/internal/app"
	"github.com/ROBERT257/femProject/internal/app/routes"
)

func main() {
	defaultPort := 8080
	if value := os.Getenv("SERVER_PORT"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			defaultPort = parsed
		}
	}

	var port int
	flag.IntVar(&port, "port", defaultPort, "go backend server port")
	flag.Parse()

	app, err := app.NewApplication()
	if err != nil {
		fmt.Println("panic:", err)
		return
	}
	defer app.DB.Close()

	r := routes.SetupRoutes(app)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      r,
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 5 * time.Minute,
	}

	app.Logger.Printf("✅ We are running our app on port %d", port)

	err = server.ListenAndServe()
	if err != nil {
		app.Logger.Fatal(err)
	}
}
