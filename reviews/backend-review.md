# Backend Code Review Report

## 1. CRITICAL Findings

### 1.1 Duplicate hash function -- `hash_token` vs `hash_sha256`
- **Severity:** Critical
- **Files:** `backend/src/auth/jwt.rs` line 96, `backend/src/services/auth.rs` line 435
- **Description:** There are two identical SHA-256 hashing functions: `jwt::hash_token()` and `auth_service::hash_sha256()`. The `jwt::hash_token()` function is exported but **never used in production code** -- all auth service code uses the private `hash_sha256()` copy. This is not just duplication; it means if someone later calls `jwt::hash_token()` expecting it to be the canonical function for token hashing, and its implementation diverges from `hash_sha256()`, tokens will fail to verify.
- **Fix:** Delete `hash_sha256` from `services/auth.rs` and use `jwt::hash_token` everywhere instead.

### 1.2 Race condition in magic link verify + user creation (TOCTOU)
- **Severity:** Critical
- **File:** `backend/src/services/auth.rs` lines 265-323
- **Description:** `verify_magic_link_token` marks the token as used, then calls `find_or_create_email_user`, which does a SELECT then an INSERT without a transaction. Two concurrent magic link verifications for the same new email could both pass the `fetch_optional` check and attempt to INSERT, causing a UNIQUE constraint violation on `users.email`. The token marking + user creation should be wrapped in a single transaction.
- **Fix:** Wrap the entire `verify_magic_link_token` body in a `write_db.begin()` transaction.

### 1.3 Race condition in refresh token rotation
- **Severity:** Critical
- **File:** `backend/src/services/auth.rs` lines 153-228
- **Description:** `refresh_tokens` does SELECT, DELETE, then INSERT as three separate queries without a transaction. If two concurrent requests present the same refresh token, both could pass the SELECT (before the first DELETE completes), leading to duplicate family tokens or the stolen-token detection falsely revoking all sessions. The entire rotation should be wrapped in a transaction.
- **Fix:** Use `write_db.begin()` to make the SELECT + DELETE + INSERT atomic.

### 1.4 Google ID token not cryptographically verified
- **Severity:** Critical
- **File:** `backend/src/services/auth.rs` lines 368-380
- **Description:** The comment says "without verification -- Google already verified it," but this is incorrect. The ID token is received from Google's token endpoint, which is trusted over TLS. However, the code manually base64-decodes the JWT payload without verifying the signature. An attacker who can intercept or tamper with the response (MITM on a misconfigured system, or a compromised proxy) could forge any user identity. The standard practice is to either verify the JWT signature using Google's public keys, or use Google's tokeninfo endpoint.
- **Fix:** Use the `jsonwebtoken` crate to verify the Google ID token against Google's JWKS keys, or call `https://oauth2.googleapis.com/tokeninfo?id_token=...`.

## 2. HIGH Findings

### 2.1 No transaction in `replace_profile_links`
- **Severity:** High
- **File:** `backend/src/services/user.rs` lines 274-311
- **Description:** This function DELETEs all existing links, then INSERTs new ones in a loop, all without a transaction. If the server crashes mid-loop or any INSERT fails, the user loses their existing links with only a partial set of new ones.
- **Fix:** Wrap the DELETE + INSERT loop in a transaction.

### 2.2 No transaction in `delete_profile`
- **Severity:** High
- **File:** `backend/src/services/user.rs` lines 313-353
- **Description:** The profile DELETE and link DELETE are two separate statements without a transaction. If the first succeeds and the second fails, orphaned links remain.
- **Fix:** Wrap in a transaction.

### 2.3 `update_listing` allows setting arbitrary `status` values
- **Severity:** High
- **File:** `backend/src/services/listing.rs` line 171
- **Description:** `update_listing` takes `req.status.as_deref().unwrap_or(&listing.status)` and writes it directly to the DB. There is no validation that the status is a valid value (`draft`, `active`, `closed`). A user can set `status` to any string. While the SQLite CHECK constraint will reject invalid values, the error will surface as an opaque database error instead of a clear 400 Bad Request.
- **Fix:** Validate `status` against allowed values before the SQL update, similar to how `format` and `visibility` are validated elsewhere.

### 2.4 `update_listing` does not re-validate `outcome_criteria` minimum of 3
- **Severity:** High
- **File:** `backend/src/services/listing.rs` lines 131-198
- **Description:** When creating a listing, `outcome_criteria` requires at least 3 items (line 23). But `update_listing` accepts any number, allowing a user to update and provide fewer than 3 criteria, bypassing the business rule.
- **Fix:** Add the same `len() < 3` validation in `update_listing`.

### 2.5 Notification preferences not checked before sending emails
- **Severity:** High
- **Files:** `backend/src/services/application.rs` lines 76-88, 245-265; `backend/src/services/outcome_review.rs` lines 76-93
- **Description:** The system fires off notification emails (new application, status update, new review) without consulting the user's `notification_preferences`. Users who set `email_enabled = false` or specific preferences to false will still receive emails.
- **Fix:** Query `notification_preferences` before spawning the email task, and skip sending if the relevant preference is disabled.

### 2.6 Magic link URL not URL-encoded
- **Severity:** High
- **File:** `backend/src/handlers/auth.rs` lines 77-79
- **Description:** The magic link is constructed via simple string concatenation: `format!("{}?token={}&email={}", ...)`. Neither the token nor the email is URL-encoded. Emails with `+` characters (e.g., `user+tag@example.com`) will be corrupted. The token is hex-encoded so it is safe, but the email is not.
- **Fix:** URL-encode the email parameter (e.g., use `urlencoding::encode`).

### 2.7 CORS allows only a single origin
- **Severity:** Medium (but operationally High for multi-environment setups)
- **File:** `backend/src/routes.rs` line 16-19
- **Description:** `CorsLayer` is configured with `.allow_origin(...)` parsing a single `HeaderValue`. If you need multiple origins (e.g., staging + production), this won't work. Also, `PATCH` is not in `allow_methods`, which is fine now but limits future flexibility.
- **Fix:** Consider supporting a comma-separated list of origins or `*` for development.

## 3. MEDIUM Findings

### 3.1 Massive SQL SELECT string duplicated 5+ times
- **Severity:** Medium
- **Files:** `backend/src/services/listing.rs` lines 93-104, 358-370, 408-422, 455-462; `backend/src/services/interest.rs` lines 73-85
- **Description:** The `ListingWithAuthor` SELECT clause (with all JOINs to users, organization_profiles, individual_profiles) is copy-pasted in at least 5 locations. Any schema change requires updating all of them simultaneously.
- **Fix:** Extract a constant or helper function like `fn listing_with_author_select() -> &'static str`.

### 3.2 Pagination helper code duplicated across 5+ query structs
- **Severity:** Medium
- **Files:** `models/listing.rs`, `models/application.rs`, `models/interest.rs`, `models/notification.rs`, `models/message.rs`
- **Description:** The `page()`, `per_page()`, and `offset()` methods are identically implemented on `ListingFeedQuery`, `PaginationQuery`, `ApplicationQuery`, `SavedListingsQuery`, `NotificationQuery`, and `MessageQuery`. This is classic boilerplate duplication.
- **Fix:** Extract a `Paginated` trait or use a generic pagination wrapper struct.

### 3.3 `send_message` constructs `MessageResponse` manually with `chrono::Utc::now()` instead of reading from DB
- **Severity:** Medium
- **File:** `backend/src/services/message.rs` lines 102-110
- **Description:** After inserting a message, the response is manually constructed using `chrono::Utc::now()` for `created_at` and hardcoded `is_read: true`. This means the returned `created_at` will differ from the SQLite `datetime('now')` default (different clocks, potential timezone issues). Other services correctly re-fetch the row from the DB after insert.
- **Fix:** Re-fetch the inserted message from the DB, consistent with the pattern used elsewhere.

### 3.4 `delete_listing` uses HTTP DELETE but performs a soft-delete (sets status to 'closed')
- **Severity:** Medium
- **File:** `backend/src/services/listing.rs` lines 200-220; handler at `backend/src/handlers/listings.rs` line 44-51
- **Description:** REST conventions expect `DELETE` to actually remove or indicate removal of a resource. This endpoint returns 200 with `{"message": "Listing closed"}`, which is confusing. It should either be a `PUT /listings/{id}/close` endpoint, or return 204 No Content.
- **Fix:** Either rename to `PUT /{id}/status` or `POST /{id}/close`, or return 204 with an empty body.

### 3.5 `received_interests` and `matches` endpoints lack pagination
- **Severity:** Medium
- **File:** `backend/src/services/interest.rs` lines 170-215
- **Description:** `get_received_interests` and `get_matches` return all rows unbounded with no LIMIT. For users with many listings receiving many interests, this could return thousands of rows.
- **Fix:** Add pagination parameters consistent with other list endpoints.

### 3.6 `conversations` endpoint has no pagination
- **Severity:** Medium
- **File:** `backend/src/services/message.rs` lines 173-223
- **Description:** `get_conversations` returns all conversations with no LIMIT or pagination.
- **Fix:** Add pagination.

### 3.7 No expired magic link token cleanup
- **Severity:** Medium
- **File:** Schema + `backend/src/services/auth.rs`
- **Description:** Expired and used magic link tokens accumulate forever. There is no periodic cleanup or TTL-based deletion.
- **Fix:** Add a periodic cleanup task or add cleanup logic during token creation (e.g., `DELETE FROM magic_link_tokens WHERE expires_at < datetime('now')` before inserting).

### 3.8 No expired refresh token cleanup
- **Severity:** Medium
- **File:** Schema + `backend/src/services/auth.rs`
- **Description:** Same as above -- expired refresh tokens accumulate with no cleanup mechanism.
- **Fix:** Add periodic cleanup or clean up during refresh operations.

### 3.9 `OptionalAuthUser` swallows all errors silently
- **Severity:** Medium
- **File:** `backend/src/auth/middleware.rs` lines 47-59
- **Description:** If a user provides an `Authorization` header with an **invalid** (not expired, not missing, but malformed or tampered) token, `OptionalAuthUser` treats them as unauthenticated rather than returning an error. This could mask legitimate issues and confuse debugging.
- **Fix:** Distinguish between "no header present" (treat as anonymous) and "header present but invalid" (return 401).

### 3.10 `create_listing` inserts with `status = 'active'` but schema default is `'draft'`
- **Severity:** Medium
- **File:** `backend/src/services/listing.rs` line 61
- **Description:** The schema's CHECK constraint includes `draft` as a valid status, but the code always creates listings as `active`. If draft functionality is intended, there's no way for users to create draft listings through the API. If it's not intended, `draft` should be removed from the CHECK constraint.
- **Fix:** Either add a `status` field to `CreateListingRequest` with validation, or remove `draft` from the schema constraint.

## 4. LOW Findings

### 4.1 `f64` for monetary values (`price_usd`)
- **Severity:** Low
- **File:** `backend/src/models/listing.rs` line 14
- **Description:** Using `f64` for currency introduces floating-point precision issues.
- **Fix:** Consider storing cents as integers, or using a decimal library.

### 4.2 Missing index on `messages.sender_id`
- **Severity:** Low
- **File:** `backend/migrations/014_create_messages.sql`
- **Description:** The `messages` table has indexes on `application_id` and `read_at`, but the `get_conversations` query filters on `sender_id != ?` for unread counts. No index on `sender_id` exists.
- **Fix:** Add `CREATE INDEX idx_messages_sender ON messages(sender_id)`.

### 4.3 Missing composite index on `listings(author_role, status, created_at)`
- **Severity:** Low
- **File:** `backend/migrations/020_recreate_indexes.sql`
- **Description:** The feed query filters on `status = 'active'` and optionally `author_role`, then orders by `created_at DESC`. The existing separate indexes on `status` and `created_at` are suboptimal for this combined query.
- **Fix:** Add `CREATE INDEX idx_listings_feed ON listings(status, author_role, created_at DESC)`.

### 4.4 `format!` with table names could be SQL injection if inputs change
- **Severity:** Low (currently safe)
- **Files:** `backend/src/services/auth.rs` line 62; `backend/src/services/user.rs` lines 325, 340
- **Description:** `format!("SELECT ... FROM {} WHERE ...", table)` where `table` comes from a hardcoded `if/else`. Currently safe since the values are string literals, but this pattern is fragile.
- **Fix:** Use separate query strings or a match statement returning string literals rather than `format!`.

### 4.5 `checked_add_signed` unwrap could panic
- **Severity:** Low
- **File:** `backend/src/services/auth.rs` lines 85-86, 129-130, 193-194, 248-249
- **Description:** `Utc::now().checked_add_signed(Duration::seconds(...)).unwrap()` will panic if the result overflows. Practically impossible with reasonable expiry values.
- **Fix:** Use `.ok_or_else(|| AppError::Internal("timestamp overflow".into()))?`.

### 4.6 Email subject line not HTML-escaped but body is
- **Severity:** Low
- **File:** `backend/src/services/email.rs` lines 170, 190, 209
- **Description:** `listing_title` is HTML-escaped in the body via `html_escape()` but used raw in the email subject line.
- **Fix:** Sanitize or truncate the subject line.

### 4.7 Rate limiter configuration is very permissive for auth endpoints
- **Severity:** Low
- **File:** `backend/src/middleware/rate_limit.rs` lines 6-8
- **Description:** The global rate limiter allows 2 requests/second with a burst of 20. This applies uniformly to all endpoints.
- **Fix:** Add a more restrictive rate limiter specifically for auth endpoints.

### 4.8 `send_message` verifies messaging access against `read_db` but writes to `write_db`
- **Severity:** Low
- **File:** `backend/src/services/message.rs` line 50
- **Description:** `verify_messaging_access` is called with `read_db`, but due to SQLite WAL mode replication lag, the authorization check and the write operate on potentially different snapshots.
- **Fix:** Pass `write_db` for the authorization check in write operations.

### 4.9 `create_application` handler does not return 201 Created
- **Severity:** Low
- **File:** `backend/src/handlers/applications.rs` line 29
- **Description:** Successful creation returns the default 200 OK. REST convention is to return 201 Created for resource creation.
- **Fix:** Return `(StatusCode::CREATED, Json(application.into()))`.

### 4.10 `MessageQuery.per_page()` allows 0
- **Severity:** Low
- **File:** `backend/src/models/message.rs` line 58-59
- **Description:** `per_page()` uses `.min(100)` but does not clamp to a minimum of 1 like other pagination helpers do.
- **Fix:** Add `.max(1)` like other pagination implementations.
