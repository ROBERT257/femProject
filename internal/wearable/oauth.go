package wearable

import (
    "context"
    "crypto/rand"
    "database/sql"
    "encoding/hex"
    "fmt"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/ROBERT257/femProject/internal/store"
    "golang.org/x/oauth2"
)

const oauthStateCookieName = "gf_oauth_state"
const providerGoogle = "google_fit"

// buildOAuthConfig constructs an oauth2.Config from env vars.
func buildOAuthConfig() *oauth2.Config {
    clientID := os.Getenv("GOOGLE_CLIENT_ID")
    clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
    redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
    if clientID == "" || clientSecret == "" || redirectURL == "" {
        return nil
    }
    return &oauth2.Config{
        ClientID:     clientID,
        ClientSecret: clientSecret,
        RedirectURL:  redirectURL,
        Scopes: []string{
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.body.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
        },
        Endpoint: oauth2.Endpoint{
            AuthURL:  "https://accounts.google.com/o/oauth2/v2/auth",
            TokenURL: "https://oauth2.googleapis.com/token",
        },
    }
}

// generateState creates a random state token.
func generateState() (string, error) {
    b := make([]byte, 16)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    return hex.EncodeToString(b), nil
}

// HandleGoogleLogin redirects the user to Google's OAuth consent screen.
// Expects a query param `user_id` (int64) to associate the connection.
func (h *Handler) HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
    userIDStr := r.URL.Query().Get("user_id")
    if userIDStr == "" {
        http.Error(w, "user_id is required", http.StatusBadRequest)
        return
    }
    if _, err := strconv.ParseInt(userIDStr, 10, 64); err != nil {
        http.Error(w, "invalid user_id", http.StatusBadRequest)
        return
    }

    cfg := buildOAuthConfig()
    if cfg == nil {
        http.Error(w, "oauth config not set", http.StatusInternalServerError)
        return
    }

    state, err := generateState()
    if err != nil {
        http.Error(w, "failed to generate state", http.StatusInternalServerError)
        return
    }

    // Store state in a cookie (short lived)
    cookie := &http.Cookie{
        Name:     oauthStateCookieName,
        Value:    state + ":" + userIDStr,
        HttpOnly: true,
        Path:     "/",
        Expires:  time.Now().Add(10 * time.Minute),
    }
    http.SetCookie(w, cookie)

    // Request offline access to get a refresh token
    url := cfg.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "consent"))
    http.Redirect(w, r, url, http.StatusFound)
}

// HandleGoogleCallback handles OAuth callback and stores tokens.
func (h *Handler) HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
    cfg := buildOAuthConfig()
    if cfg == nil {
        http.Error(w, "oauth config not set", http.StatusInternalServerError)
        return
    }

    queryState := r.URL.Query().Get("state")
    code := r.URL.Query().Get("code")
    if queryState == "" || code == "" {
        http.Error(w, "missing state or code", http.StatusBadRequest)
        return
    }

    c, err := r.Cookie(oauthStateCookieName)
    if err != nil {
        http.Error(w, "state cookie missing", http.StatusBadRequest)
        return
    }

    // cookie value stored as state:user_id
    parts := []byte(c.Value)
    // simple split by ':'
    var storedState, userIDStr string
    for i := 0; i < len(parts); i++ {
        if parts[i] == ':' {
            storedState = string(parts[:i])
            userIDStr = string(parts[i+1:])
            break
        }
    }
    if storedState == "" || userIDStr == "" {
        http.Error(w, "invalid state cookie", http.StatusBadRequest)
        return
    }
    if storedState != queryState {
        http.Error(w, "state mismatch", http.StatusBadRequest)
        return
    }

    userID, err := strconv.ParseInt(userIDStr, 10, 64)
    if err != nil {
        http.Error(w, "invalid user id", http.StatusBadRequest)
        return
    }

    // Exchange code for token
    token, err := cfg.Exchange(context.Background(), code)
    if err != nil {
        h.logger.Error("token exchange failed", "error", err)
        http.Error(w, "failed to exchange token", http.StatusBadGateway)
        return
    }

    // Persist connection
    wc := &store.WearableConnection{
        UserID:      userID,
        Provider:    providerGoogle,
        AccessToken: token.AccessToken,
        RefreshToken: func() string {
            if token.RefreshToken != "" {
                return token.RefreshToken
            }
            // If refresh token not returned, try to fetch existing and keep it
            existing, _ := h.service.store.GetWearableConnection(r.Context(), userID, providerGoogle)
            if existing != nil {
                return existing.RefreshToken
            }
            return ""
        }(),
    }
    if !token.Expiry.IsZero() {
        wc.TokenExpiry = sql.NullTime{Time: token.Expiry, Valid: true}
    }

    if err := h.service.store.SaveWearableConnection(r.Context(), wc); err != nil {
        h.logger.Error("failed to save wearable connection", "error", err)
        http.Error(w, "failed to save connection", http.StatusInternalServerError)
        return
    }

    // For now redirect to a simple success page or JSON
    w.Header().Set("Content-Type", "application/json")
    fmt.Fprintf(w, "{\"status\":\"connected\", \"provider\":\"%s\", \"user_id\":%d}", providerGoogle, userID)
}
