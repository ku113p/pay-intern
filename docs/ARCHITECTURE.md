# Architecture

DevStage is a two-role marketplace (developers and companies) built as a monorepo with a Rust API backend and a React SPA frontend.

## System Overview

```
┌─────────────┐      /api/*       ┌───────────────┐
│   Frontend   │ ──────────────►  │    Backend     │
│  React SPA   │  nginx proxy     │  Axum (Rust)   │
│  port 80     │  (or Vite dev    │  port 3000     │
│              │   proxy :5173)   │                │
└─────────────┘                   └───────┬───────┘
                                          │
                                  ┌───────▼───────┐
                                  │    SQLite      │
                                  │  WAL mode      │
                                  │  data/         │
                                  └───────────────┘
```

In development, Vite proxies `/api` requests to `localhost:3000` (stripping the `/api` prefix). In production, nginx handles the same proxy and serves the built SPA.

## Backend Architecture

### Three-Layer Pattern

```
HTTP Request
    │
    ▼
┌──────────┐   Parse request, extract auth,    ┌──────────┐   Business logic,     ┌──────────┐
│ Handlers │   call service, format response    │ Services │   validation, authz   │   SQLite  │
│          │ ─────────────────────────────────► │          │ ──────────────────────►│          │
│  (thin)  │                                    │  (logic) │   via sqlx queries    │  (data)  │
└──────────┘                                    └──────────┘                       └──────────┘
```

- **Handlers** (`src/handlers/`) — Thin HTTP layer. Each file maps to a route group (`/auth`, `/users`, `/profiles`, `/listings`, `/applications`, `/outcome-reviews`). Handlers deserialize the request, call a service function, and return a JSON response. No business logic lives here.

- **Services** (`src/services/`) — All business logic. Authorization checks, cross-entity validation (e.g., "can this user apply to this listing?"), and database queries via sqlx. Services receive pool references and return domain types or `AppError`.

- **Models** (`src/models/`) — Rust structs for database rows (implementing `sqlx::FromRow`) and request/response DTOs (implementing `serde::Deserialize`/`Serialize`).

### SQLite Dual-Pool Strategy

SQLite only allows one writer at a time. The backend uses two separate connection pools to avoid write contention while allowing concurrent reads:

```rust
AppState {
    read_db: SqlitePool,   // 5 connections, read-only
    write_db: SqlitePool,  // 1 connection, read-write
    config: Arc<Config>,
}
```

- **read_db** — Used by all GET/read operations (feeds, profile lookups, application lists). Multiple concurrent readers are safe in WAL mode.
- **write_db** — Used by all POST/PUT/DELETE operations (creating listings, updating application status, issuing tokens). The single-connection pool serializes writes, preventing SQLite busy errors.

Both pools are created in `src/db.rs` with WAL journal mode and foreign keys enabled. Migrations run automatically at startup via `sqlx::migrate!()`.

### Authentication System

Two auth methods: magic link (email) and Google OAuth. Both produce the same JWT token pair.

**Token Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Access Token (JWT, HS256)                               │
│   Claims: { sub: user_id, role, exp }                   │
│   Signed with: JWT_ACCESS_SECRET                        │
│   Lifetime: 15 minutes                                  │
│   Stored: frontend memory only (Zustand store)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Refresh Token (JWT, HS256)                              │
│   Claims: { sub: user_id, family_id, exp }              │
│   Signed with: JWT_REFRESH_SECRET (separate key!)       │
│   Lifetime: 7 days                                      │
│   Stored: frontend localStorage, DB as SHA-256 hash     │
└─────────────────────────────────────────────────────────┘
```

Access and refresh tokens use **separate signing keys** so that an access key leak doesn't compromise refresh tokens.

**Refresh Token Rotation with Stolen-Token Detection:**

Each refresh token belongs to a `family_id`. When a token is refreshed:

1. Old token is deleted from DB
2. New token is issued with the **same family_id**
3. If a token is presented that doesn't exist in DB but its family_id does exist, all tokens in that family are revoked — this indicates a stolen token was reused after the legitimate user already rotated it.

```
Normal flow:
  RT-1 (family A) → rotate → RT-2 (family A) → rotate → RT-3 (family A)

Theft detected:
  RT-1 stolen by attacker
  User rotates: RT-1 → RT-2
  Attacker presents RT-1 → not found in DB, family A exists → REVOKE ALL family A
```

**Magic Link Flow:**

```
1. POST /auth/magic-link/request  { email, role }
   → generates 64-byte random token, stores SHA-256 hash in magic_link_tokens (15 min expiry)
   → returns raw token (dev mode) or sends email (production)

2. POST /auth/magic-link/verify   { email, token }
   → verifies SHA-256 hash match, marks token as used
   → find_or_create_user → issues access + refresh token pair
```

**Google OAuth Flow:**

```
1. Frontend redirects to Google consent screen
2. Google redirects back with authorization code
3. POST /auth/google  { code, role }
   → exchanges code for id_token at googleapis.com
   → decodes JWT payload (email, sub, name)
   → find user by Google sub, or link existing email user, or create new
   → issues access + refresh token pair
```

**Auth Middleware:**

Two Axum extractors in `src/auth/middleware.rs`:
- `AuthUser { user_id, role }` — Required auth. Reads `Authorization: Bearer <token>`, returns 401 if missing/invalid.
- `OptionalAuthUser` — Same but wraps in `Option`. Used for public endpoints that behave differently when authenticated (e.g., visibility filtering).

### Routing

All routes are registered in `src/routes.rs` via `build_router()`. Uses Axum 0.8 path syntax (`{id}`, not `:id`). Route groups are nested under prefixes:

| Prefix | Auth | Purpose |
|---|---|---|
| `/auth` | none | Login, register, token refresh |
| `/users` | required | Current user CRUD |
| `/profiles` | mixed | Own profile (auth), public profiles (none) |
| `/listings` | mixed | CRUD (auth), feeds (mixed) |
| `/applications` | required | Apply, list, accept/reject |
| `/outcome-reviews` | required | Create, view, consent |

Global middleware layers (applied in order): `RequestBodyLimitLayer` (1MB) → `CorsLayer` → `TraceLayer`.

### Error Handling

`AppError` enum in `src/error.rs` implements `IntoResponse`, returning `{"error": "message"}` with the appropriate HTTP status code. Has `From` implementations for `sqlx::Error`, `jsonwebtoken::errors::Error`, and `validator::ValidationErrors`, so service functions can use `?` freely.

## Database Schema

8 tables across 5 migration files. All IDs are UUIDs stored as TEXT. Timestamps are ISO 8601 strings via `datetime('now')`.

```
users
  ├── refresh_tokens     (family_id for rotation tracking)
  ├── magic_link_tokens  (SHA-256 hashed, single-use, 15min expiry)
  ├── developer_profiles (1:1, bio/tech_stack/github/linkedin/level)
  ├── company_profiles   (1:1, company_name/description/website/size/tech_stack)
  └── listings           (type: developer|company, visibility, status)
       └── applications  (UNIQUE per listing+applicant, status: pending|accepted|rejected)
            └── outcome_reviews (UNIQUE per application, consent-based profile visibility)
```

**Key constraints:**
- `applications` has `UNIQUE(listing_id, applicant_id)` — one application per user per listing
- `outcome_reviews` has `UNIQUE(application_id)` — one review per application
- `listings.type` determines the listing kind: `developer` (dev offering services) or `company` (company offering internship)
- `listings.outcome_criteria` is required for company-type listings (enforced in service layer, min 3 items)

## Business Rules

### Cross-Role Applications

The marketplace enforces cross-role matching:
- Developers can only apply to **company** listings
- Companies can only apply to **developer** listings
- No self-applications (cannot apply to your own listing)

### Listing Visibility

Three visibility levels, enforced in `services/listing.rs`:
- `public` — anyone can view
- `authenticated` — requires valid JWT
- `private` — only the author can view

### Outcome Review Lifecycle

```
Company creates listing with outcome_criteria
  → Developer applies → Company accepts
    → Company creates review (criteria_results + recommendation)
      → Developer consents: { visible_in_profile: true/false, developer_response }
```

Reviews are visible to the reviewer and reviewed party. If `visible_in_profile` is true, anyone can see it. The developer can attach a response.

Recommendations: `ready_to_hire` | `needs_practice` | `not_recommended`
Per-criterion results: `pass` | `partial` | `fail`

## Frontend Architecture

### State Management

```
┌──────────────────┐     ┌─────────────────┐     ┌────────────────┐
│  Zustand Store   │     │  React Query    │     │  Axios Client  │
│  (auth state)    │     │  (server state) │     │  (HTTP layer)  │
│                  │     │                 │     │                │
│  accessToken     │────►│  useDeveloper   │────►│  baseURL: /api │
│  refreshToken    │     │    Feed()       │     │  auto Bearer   │
│  user            │     │  useListing()   │     │  auto refresh  │
│  isAuthenticated │     │  useCompany     │     │  on 401        │
│                  │     │    Feed()       │     │                │
└──────────────────┘     └─────────────────┘     └────────────────┘
```

- **Zustand** (`stores/auth.ts`) — Auth-only state. Access token in memory, refresh token in localStorage. The `setTokens` / `logout` actions manage both.
- **React Query** (`hooks/`) — Server state caching for feeds and listing data.
- **Axios** (`api/client.ts`) — Central HTTP client. Request interceptor attaches Bearer token. Response interceptor catches 401 → attempts token refresh → retries original request → redirects to `/login` on failure.

### Route Protection

`ProtectedRoute` component wraps routes that require auth. Checks `isAuthenticated` from Zustand; redirects to `/login` if false.

Public routes: `/`, `/login`, `/register`, `/auth/verify`, `/developers`, `/listings/:id`, `/profiles/:type/:id`
Protected routes: `/companies`, `/listings/new`, `/applications`, `/profile`

## Deployment

### Docker Images

Two multi-stage Docker images, built and pushed to GHCR via GitHub Actions:

**Backend** (`backend/Dockerfile`):
- Build stage: `rust:1.88-alpine`, bind mounts for source, cargo cache mounts
- Runtime stage: `alpine:3.21`, non-root `appuser`, binary at `/bin/server`, migrations at `/app/migrations/`, data volume at `/app/data/`

**Frontend** (`frontend/Dockerfile`):
- deps → build → nginx stages
- nginx serves static files and proxies `/api/` to backend

### CI/CD Pipeline

```
push to master
    │
    ├──► test-backend (cargo test)  ──► build-backend (Docker → GHCR)
    │
    └──► test-frontend (npm build)  ──► build-frontend (Docker → GHCR)
```

Build jobs only run on master push after tests pass. Images tagged with `:latest` and `:${SHA}`.
