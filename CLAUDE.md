# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

### Backend (Rust/Axum)
```bash
cd backend
cp .env.example .env          # first time only
cargo run                     # starts on :3000
cargo test                    # run all tests
cargo test test_name          # run a single test
cargo check                   # fast compile check
```

### Frontend (React/Vite)
```bash
cd frontend
npm install                   # install deps
npm run dev                   # dev server on :5173
npm run build                 # production build (runs tsc -b && vite build)
npm run lint                  # eslint
```

### Docker
```bash
docker compose up -d          # run both services
docker compose pull           # pull latest images from GHCR
```

## Architecture

**Monorepo:** `backend/` (Rust) + `frontend/` (React/TypeScript)

### Backend

Three-layer architecture: **handlers → services → database (sqlx)**

- `handlers/` — Thin HTTP layer. Parses requests, calls services, returns JSON responses. Each handler file maps to a route group.
- `services/` — Business logic. Validation, authorization checks, cross-entity rules. All database queries live here via sqlx.
- `models/` — Rust structs for DB rows and request/response DTOs.
- `auth/jwt.rs` — Separate access tokens (15min, `AccessClaims`) and refresh tokens (7 days, `RefreshClaims`) with **separate signing keys**. Refresh tokens use family_id tracking for stolen-token detection.
- `auth/middleware.rs` — `AuthUser` and `OptionalAuthUser` Axum extractors from `Authorization: Bearer` header.
- `routes.rs` — All route registration via `build_router()`. Uses Axum 0.8 path syntax: `{id}` not `:id`.
- `db.rs` — **Two separate SQLite pools**: `write_db` (1 connection) and `read_db` (5 connections). SQLite only allows one writer at a time; this prevents write contention. Both use WAL mode.
- `error.rs` — `AppError` enum implementing `IntoResponse`. Has `From` impls for sqlx, jsonwebtoken, and validator errors.

**Shared state** passed to all handlers:
```rust
pub struct AppState {
    pub read_db: SqlitePool,   // use for GET/read operations
    pub write_db: SqlitePool,  // use for POST/PUT/DELETE operations
    pub config: Arc<Config>,
}
```

**Tokens in DB are SHA-256 hashed** (never stored raw). See `auth/jwt.rs` for `hash_token()` and `generate_raw_token()`.

### Frontend

- `api/client.ts` — Axios instance with baseURL `/api`. Request interceptor attaches Bearer token from Zustand store. Response interceptor handles 401 → automatic token refresh → retry.
- `stores/auth.ts` — Zustand store. Access token in memory only, refresh token in localStorage.
- `hooks/` — React Query hooks for data fetching with caching.
- `components/auth/ProtectedRoute.tsx` — Wrapper that redirects to `/login` if not authenticated.
- Vite dev proxy: `/api` → `http://localhost:3000` (strips `/api` prefix). In production, nginx handles this proxy.

### Key Conventions

- Backend uses runtime SQL queries (`sqlx::query()` / `sqlx::query_as()`), not compile-time checked macros. No `.sqlx/` offline data needed.
- Migrations run automatically at startup in `db.rs` via `sqlx::migrate!()`.
- Company listings require `outcome_criteria` (min 3 items). Developer listings do not.
- Cross-role applications: developers apply to company listings and vice versa.
- Visibility rules on listings: `public` (anyone), `authenticated` (valid JWT), `private` (author only).

## CI/CD

GitHub Actions (`.github/workflows/build.yml`): test-backend → build-backend, test-frontend → build-frontend. Images push to GHCR on master merges.
