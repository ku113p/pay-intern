# DevOps, Configuration & Infrastructure Review

## 1. DOCKER

### Finding 1.1 -- Backend .env is committed to the repository
- **Severity:** Critical
- **File:** `backend/.env`
- **Description:** The file `backend/.env` exists in the repository and contains JWT secrets. Even though the root `.gitignore` lists `.env`, the file is currently tracked.
- **Suggested fix:** Run `git rm --cached backend/.env` to untrack the file. Rotate any secrets that were ever committed.

### Finding 1.2 -- Config struct derives Debug, leaking secrets in logs
- **Severity:** High
- **File:** `backend/src/config.rs`, line 4
- **Description:** `Config` derives `Debug`, which means if it is ever logged, JWT secrets, SMTP passwords, and Google OAuth secrets will appear in plain text.
- **Suggested fix:** Remove `Debug` from `Config`'s derive, or implement a manual `Debug` that redacts sensitive fields.

### Finding 1.3 -- Frontend Dockerfile does not pin nginx base image version
- **Severity:** Medium
- **File:** `frontend/Dockerfile`, line 20
- **Description:** `FROM nginx:alpine` uses the floating `alpine` tag. Builds are not reproducible.
- **Suggested fix:** Pin to a specific version, e.g., `FROM nginx:1.27-alpine3.21`.

### Finding 1.4 -- No health check for the frontend container
- **Severity:** Medium
- **File:** `docker-compose.yml`, lines 33-40
- **Suggested fix:** Add a healthcheck: `test: ["CMD", "wget", "-qO-", "http://localhost:80/"]`.

### Finding 1.5 -- No resource limits on any container
- **Severity:** Medium
- **File:** `docker-compose.yml`
- **Suggested fix:** Add `deploy.resources.limits` with appropriate CPU and memory caps.

### Finding 1.6 -- No backup strategy for SQLite volume
- **Severity:** High
- **File:** `docker-compose.yml`, line 24
- **Description:** Production database lives in a Docker named volume with no backup mechanism.
- **Suggested fix:** Implement periodic backup using `sqlite3 <db> ".backup /path/to/backup.db"`.

### Finding 1.7 -- Health check endpoint does not verify database connectivity
- **Severity:** Medium
- **File:** `backend/src/routes.rs`, lines 180-182
- **Description:** The `/health` endpoint returns `{"status": "ok"}` unconditionally.
- **Suggested fix:** Execute `SELECT 1` against the read pool and return error status if it fails.

## 2. CI/CD

### Finding 2.1 -- No lint step for the backend
- **Severity:** Medium
- **File:** `.github/workflows/build.yml`, lines 14-32
- **Suggested fix:** Add `cargo fmt --check` and `cargo clippy -- -D warnings`.

### Finding 2.2 -- No lint step for the frontend
- **Severity:** Medium
- **File:** `.github/workflows/build.yml`, lines 34-49
- **Suggested fix:** Add `npm run lint`.

### Finding 2.3 -- No security/dependency scanning
- **Severity:** Medium
- **File:** `.github/workflows/build.yml`
- **Suggested fix:** Add `cargo audit` and `npm audit --audit-level=high`.

### Finding 2.4 -- Frontend "test" job only builds, runs no tests
- **Severity:** Low
- **File:** `.github/workflows/build.yml`, lines 45-49

### Finding 2.5 -- Only the `latest` tag is mutable; no rollback tagging strategy
- **Severity:** Low
- **File:** `.github/workflows/build.yml`, lines 73-75 and 101-103

## 3. CONFIGURATION

### Finding 3.1 -- .env.example uses weak placeholder secrets
- **Severity:** Low
- **File:** `backend/.env.example`, lines 2-3

### Finding 3.2 -- Missing SMTP_TLS_INSECURE in .env but present in .env.example
- **Severity:** Low

### Finding 3.3 -- No RUST_LOG in .env.example
- **Severity:** Low
- **File:** `backend/.env.example`

## 4. PRODUCTION ARCHITECTURE

### Finding 4.1 -- Caddy reverse-proxies to frontend only; API requests require double-hop
- **Severity:** Medium
- **File:** `Caddyfile`, lines 1-3
- **Suggested fix:** Add a direct `/api/*` route in the Caddyfile to proxy API traffic straight to the backend.

### Finding 4.2 -- nginx security headers are lost on /assets/ location block
- **Severity:** Low
- **File:** `frontend/nginx.conf`, lines 29-33
- **Description:** The `location /assets/` block uses `add_header` which replaces all inherited `add_header` directives.

### Finding 4.3 -- No request body size limit at the proxy level
- **Severity:** Low
- **File:** `frontend/nginx.conf`

### Finding 4.4 -- Graceful shutdown does not close database pools
- **Severity:** Low
- **File:** `backend/src/main.rs`, lines 54-59
- **Suggested fix:** After the server `await` completes, call `state.write_db.close().await` and `state.read_db.close().await`.

### Finding 4.5 -- SQLite read pool has no busy_timeout
- **Severity:** Low
- **File:** `backend/src/db.rs`, lines 50-53
- **Suggested fix:** Add `.busy_timeout(Duration::from_secs(5))` to `read_opts`.

## 5. DEPENDENCY / BUILD

### Finding 5.1 -- `node_modules/` may be committed to the repository
- **Severity:** High
- **File:** `frontend/node_modules/`
- **Suggested fix:** Verify with `git ls-files frontend/node_modules` and run `git rm -r --cached frontend/node_modules/` if tracked.

## Summary Table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1.1 | Critical | Docker/Security | `backend/.env` with secrets is committed to repo |
| 1.2 | High | Config/Security | `Config` derives `Debug`, can leak secrets in logs |
| 1.6 | High | Docker/Data | No backup strategy for SQLite production database |
| 5.1 | High | Project Structure | `node_modules/` possibly committed to repository |
| 1.3 | Medium | Docker | Frontend nginx base image not version-pinned |
| 1.4 | Medium | Docker | No health check for frontend container |
| 1.5 | Medium | Docker | No resource limits on any container |
| 1.7 | Medium | Docker/Backend | Health endpoint does not check DB connectivity |
| 2.1 | Medium | CI/CD | No `clippy`/`fmt` in backend CI |
| 2.2 | Medium | CI/CD | No `eslint` in frontend CI |
| 2.3 | Medium | CI/CD | No dependency/security scanning |
| 4.1 | Medium | Architecture | API traffic double-hops through Caddy + nginx |
| 2.4 | Low | CI/CD | `test-frontend` job runs no actual tests |
| 2.5 | Low | CI/CD | No rollback-friendly tagging strategy |
| 3.1 | Low | Config | `.env.example` weak placeholder secrets |
| 3.2 | Low | Config | `.env` and `.env.example` out of sync |
| 3.3 | Low | Config | `RUST_LOG` not documented in `.env.example` |
| 4.2 | Low | nginx | Security headers lost in `/assets/` location block |
| 4.3 | Low | nginx | No explicit `client_max_body_size` |
| 4.4 | Low | Backend | DB pools not closed on graceful shutdown |
| 4.5 | Low | Backend | Read pool missing `busy_timeout` |
