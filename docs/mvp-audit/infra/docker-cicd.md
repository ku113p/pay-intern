# Infrastructure: Docker и CI/CD

[← Назад](../README.md)

## Docker Compose

**Файл:** `docker-compose.yml`

```yaml
services:
  backend:
    image: ghcr.io/ku113p/pay-intern/backend:latest
    ports: ["3000:3000"]
    volumes: ["backend-data:/app/data"]
    restart: unless-stopped
    healthcheck:
      test: wget --spider http://localhost:3000/health
      interval: 30s, timeout: 5s, retries: 3

  frontend:
    image: ghcr.io/ku113p/pay-intern/frontend:latest
    ports: ["80:80"]
    depends_on:
      backend: { condition: service_healthy }
    restart: unless-stopped

volumes:
  backend-data:
```

**Хорошо:**
- Health check на backend с wget
- Frontend ждёт healthy backend
- Named volume для SQLite persistence
- `unless-stopped` restart policy

**Пробелы:**
- Нет health check на frontend (nginx)
- Нет resource limits (memory/CPU)
- Нет logging volume
- Нет backup volume

## Backend Dockerfile

**Файл:** `backend/Dockerfile`

Multi-stage build:
1. **Builder:** Rust 1.88.0 Alpine, cargo build --release с cache mounts
2. **Runtime:** Alpine 3.21, минимальные deps (sqlite-libs, libgcc, ca-certificates, wget)

**Security:** Non-root user `appuser` (UID 10001, --disabled-password)

## Frontend Dockerfile

**Файл:** `frontend/Dockerfile`

Three-stage build:
1. **Deps:** npm ci (dependency layer)
2. **Builder:** vite build (TypeScript compilation)
3. **Runtime:** Alpine nginx, копирует dist + nginx.conf

## CI/CD Pipeline

**Файл:** `.github/workflows/build.yml`

```
test-backend ──→ build-backend ──→ push GHCR
test-frontend ─→ build-frontend ─→ push GHCR
```

### test-backend (ubuntu-latest)
- Rust stable via `dtolnay/rust-toolchain@stable`
- `Swatinem/rust-cache@v2`
- `cargo test` с test env vars (test DB, placeholder secrets)

### test-frontend (ubuntu-latest)
- Node.js 22, npm cache
- `npm ci && npm run build`
- Валидирует TypeScript + Vite build

### build-backend / build-frontend (master only)
- `docker/build-push-action@v6`
- Tags: `:latest` + `:${github.sha}`
- GitHub Actions cache для Docker buildx (`cache-from: type=gha`)
- Push to GHCR using `GITHUB_TOKEN`

### Пробелы в CI/CD
- **Нет deployment job** — images built but not deployed
- **Нет staging** — нет preview/feature branch deploys
- **Frontend не lint-ится** — `npm run lint` не запускается в CI
- **Нет rollback** — нет стратегии отката
- **Нет smoke test** — после build нет health check verification
