FROM golang:1.24-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /out/femproject .

FROM alpine:3.20

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /out/femproject /app/femproject
COPY migrations /app/migrations

EXPOSE 8080
ENTRYPOINT ["/app/femproject"]