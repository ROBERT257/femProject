package api

import (
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"strings"
)

type EmailSender interface {
	Send(to, subject, body string) error
}

type SMTPEmailSender struct {
	Host string
	Port int
	From string
}

func NewSMTPEmailSenderFromEnv() *SMTPEmailSender {
	host := getenvOrDefault("SMTP_HOST", "127.0.0.1")
	port := getenvIntOrDefault("SMTP_PORT", 1025)
	from := getenvOrDefault("SMTP_FROM", "no-reply@rehabtrack.local")

	return &SMTPEmailSender{Host: host, Port: port, From: from}
}

func (s *SMTPEmailSender) Send(to, subject, body string) error {
	message := strings.Join([]string{
		fmt.Sprintf("From: %s", s.From),
		fmt.Sprintf("To: %s", to),
		fmt.Sprintf("Subject: %s", subject),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	address := fmt.Sprintf("%s:%d", s.Host, s.Port)
	return smtp.SendMail(address, nil, s.From, []string{to}, []byte(message))
}

func getenvOrDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getenvIntOrDefault(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}