# DevStage

A marketplace where junior developers pay companies for real internships with measurable outcome criteria — replacing the broken cycle of fake resume courses.

Companies post internship listings with clear outcome criteria. Developers apply, get accepted, and receive structured reviews that become verifiable proof of real-world experience.

## Tech Stack

- **Backend:** Rust (Axum), SQLite (WAL mode), JWT auth
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Infrastructure:** Docker, GitHub Actions, GHCR

## Project Structure

```
backend/          Rust API server
  src/
    handlers/     HTTP request handlers
    services/     Business logic
    models/       Data types and DTOs
    auth/         JWT and auth middleware
    middleware/   Rate limiting
  migrations/     SQLite migrations
frontend/         React SPA
  src/
    api/          API client and endpoints
    components/   UI components
    pages/        Route pages
    stores/       Zustand state
    hooks/        React Query hooks
```

## Local Development

### Prerequisites

- Rust 1.88+
- Node.js 22+
- SQLite3

### Backend

```bash
cd backend
cp .env.example .env    # edit secrets as needed
cargo run
```

Server starts at `http://localhost:3000`. Health check: `GET /health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server starts at `http://localhost:5173` with API proxy to the backend.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database path | `sqlite://data/devstage.db` |
| `JWT_ACCESS_SECRET` | Signing key for access tokens | required |
| `JWT_REFRESH_SECRET` | Signing key for refresh tokens | required |
| `JWT_ACCESS_EXPIRY_SECS` | Access token TTL | `900` (15 min) |
| `JWT_REFRESH_EXPIRY_SECS` | Refresh token TTL | `604800` (7 days) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | optional |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect | optional |
| `SMTP_HOST` | Mail server host | optional |
| `SMTP_PORT` | Mail server port | optional |
| `SMTP_FROM` | Sender email address | optional |
| `MAGIC_LINK_BASE_URL` | Base URL for magic link emails | optional |
| `SERVER_PORT` | Backend listen port | `3000` |

## Docker Deployment

### Using pre-built images

```bash
# Pull images from GHCR
docker compose pull

# Start services
docker compose up -d
```

### Building locally

```bash
docker build -t devstage-backend backend/
docker build -t devstage-frontend frontend/
```

### docker-compose

The included `docker-compose.yml` runs both services:

- **backend** on port 3000 with a persistent volume for SQLite data
- **frontend** on port 80 (nginx) with API proxy to backend

Create `backend/.env` with your secrets before starting.

```bash
docker compose up -d

# Check health
curl http://localhost:3000/health
```

## CI/CD

GitHub Actions workflow (`.github/workflows/build.yml`):

1. **test-backend** — `cargo test`
2. **test-frontend** — `npm ci && npm run build`
3. **build-backend** — Docker image pushed to GHCR
4. **build-frontend** — Docker image pushed to GHCR

Images are pushed on every merge to `master`:
- `ghcr.io/<owner>/pay-intern/backend:latest`
- `ghcr.io/<owner>/pay-intern/frontend:latest`

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/magic-link/request` | - | Request magic link email |
| POST | `/auth/magic-link/verify` | - | Verify magic link token |
| POST | `/auth/google` | - | Google OAuth login |
| POST | `/auth/refresh` | - | Refresh access token |
| POST | `/auth/logout` | yes | Logout |
| GET | `/users/me` | yes | Current user |
| PUT | `/users/me` | yes | Update display name |
| GET/PUT | `/profiles/developer` | yes | Own developer profile |
| GET/PUT | `/profiles/company` | yes | Own company profile |
| GET | `/profiles/developer/{id}` | - | Public developer profile |
| GET | `/profiles/company/{id}` | - | Public company profile |
| GET | `/listings/feed/developers` | - | Developer listings feed |
| GET | `/listings/feed/companies` | yes | Company listings feed |
| POST | `/listings` | yes | Create listing |
| GET | `/listings/{id}` | - | Get listing |
| PUT | `/listings/{id}` | yes | Update listing |
| DELETE | `/listings/{id}` | yes | Close listing |
| POST | `/applications` | yes | Apply to listing |
| GET | `/applications` | yes | List applications |
| PUT | `/applications/{id}/status` | yes | Accept/reject application |
| POST | `/outcome-reviews` | yes | Create outcome review |
| GET | `/outcome-reviews/{id}` | yes | Get review |
| PUT | `/outcome-reviews/{id}/consent` | yes | Consent to show review |
