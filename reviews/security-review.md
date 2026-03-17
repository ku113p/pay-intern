# Security Audit Report

## 1. AUTHENTICATION & AUTHORIZATION

### Finding 1.1: Google ID Token Not Cryptographically Verified
- **Severity: Critical**
- **File:** `backend/src/services/auth.rs`, lines 368-380
- **Description:** The Google ID token is decoded by base64-decoding the payload section, but its signature is never verified. The code comment says "without verification -- Google already verified it," but this is incorrect. Since the code does not validate the `aud` (audience) claim, an ID token obtained for a different Google application could be replayed against this API.
- **Attack scenario:** An attacker obtains a Google ID token issued for a different application (same Google user, different `aud`). Since `aud` is never checked, the server accepts it.
- **Suggested fix:** Use the `jsonwebtoken` crate to verify the Google ID token signature against Google's public JWKs, and validate the `aud` claim matches `config.google_client_id`. Alternatively, call the Google `userinfo` endpoint instead of parsing the ID token directly.

### Finding 1.2: Magic Link Email Not URL-Encoded
- **Severity: Medium**
- **File:** `backend/src/handlers/auth.rs`, lines 77-79
- **Description:** The magic link URL is constructed by string concatenation without URL-encoding the email parameter.
- **Attack scenario:** A user registers with an email like `user+tag&admin=true@example.com`. The `&admin=true` part becomes a separate query parameter.
- **Suggested fix:** URL-encode the `email` and `token` parameters.

### Finding 1.3: No Duplicate Application Prevention Beyond Unique Constraint
- **Severity: Low**
- **File:** `backend/src/services/application.rs`, lines 34-42
- **Description:** Duplicate application prevention relies solely on the database UNIQUE constraint. The error mapping catches this by string-matching the error message. This is fragile.

### Finding 1.4: `active_role` in JWT is Trusted Without Server-Side Verification on Every Request
- **Severity: Medium**
- **File:** `backend/src/handlers/listings.rs`, line 18; `backend/src/auth/middleware.rs`, line 39
- **Description:** The `active_role` from the JWT access token is used directly without re-verifying that the user actually has a profile for that role.
- **Attack scenario:** User creates both profiles, gets an "individual" token, deletes their individual profile, and continues creating individual listings with the stale token for up to 15 minutes.

### Finding 1.5: Switch Role Does Not Invalidate Old Refresh Tokens
- **Severity: Low**
- **File:** `backend/src/services/auth.rs`, lines 45-107
- **Description:** When a user calls `switch_role`, old refresh tokens from the previous role are not revoked.

## 2. INJECTION

### Finding 2.1: Dynamic SQL via `format!` with Table Names -- Controlled but Fragile
- **Severity: Low**
- **Files:** `backend/src/services/auth.rs` line 62, `backend/src/services/user.rs` lines 325, 340
- **Description:** Table names are interpolated into SQL strings via `format!`. Currently safe since table names are hardcoded.

### Finding 2.2: All User-Input SQL Parameters are Properly Parameterized (Positive)
### Finding 2.3: No XSS via `dangerouslySetInnerHTML` (Positive)

## 3. OWASP TOP 10

### Finding 3.1: CORS Correctly Configured (Positive)
### Finding 3.2: No CSRF Protection Needed -- Token-Based Auth (Positive)

### Finding 3.3: Refresh Token Stored in localStorage -- XSS Can Steal Sessions
- **Severity: High**
- **File:** `frontend/src/stores/auth.ts`, lines 33, 39
- **Description:** The refresh token is stored in `localStorage`, accessible to any JavaScript running on the page.
- **Suggested fix:** Store the refresh token in an HttpOnly, Secure, SameSite cookie instead.

### Finding 3.4: Listing Status Can Be Set to Arbitrary Values via Update
- **Severity: Medium**
- **File:** `backend/src/services/listing.rs`, lines 171, 174-191
- **Description:** The `status` value is never validated on update.
- **Suggested fix:** Add validation: `if !["active", "closed", "paused"].contains(&status) { return Err(...) }`.

### Finding 3.5: Public Profile Endpoints Expose Contact Email Without Authentication
- **Severity: Medium**
- **File:** `backend/src/handlers/profiles.rs`, lines 109-130
- **Description:** Public profile handlers use `OptionalAuthUser` and return the full profile including `contact_email`.
- **Suggested fix:** Strip `contact_email` from public responses.

### Finding 3.6: Magic Link Tokens Not Rate-Limited Per Email
- **Severity: Medium**
- **File:** `backend/src/handlers/auth.rs`, lines 48-67
- **Description:** No per-email rate limit on magic link requests.
- **Suggested fix:** Add per-email rate limiting (max 3 tokens per email per 15-minute window).

## 4. API SECURITY

### Finding 4.1: Rate Limiter Configuration is Weak
- **Severity: Medium**
- **File:** `backend/src/middleware/rate_limit.rs`, lines 6-8
- **Description:** Single global rate limit (2 req/sec, burst 20) with no per-endpoint differentiation.

### Finding 4.2: No Validation on `ProfileLinkInput.url` or `ProfileLinkInput.label`
- **Severity: Medium**
- **File:** `backend/src/models/user.rs`, lines 85-91
- **Description:** No `Validate` derive, no length or format validation. `javascript:` URLs possible.
- **Suggested fix:** Add `#[validate(url)]` to `url` field, add length limits, reject `javascript:` scheme.

### Finding 4.3: No Limit on Number of Profile Links
- **Severity: Low**
- **File:** `backend/src/services/user.rs`, lines 274-311

### Finding 4.4: Request Body Limit is Properly Set (Positive)

## 5. SECRETS & CONFIGURATION

### Finding 5.1: `.env` File Present in Repository
- **Severity: High**
- **File:** `backend/.env`
- **Description:** The `.env` file exists in the repository with JWT secrets.

### Finding 5.2: No Minimum Secret Length Enforcement
- **Severity: Medium**
- **File:** `backend/src/config.rs`, lines 29-30

### Finding 5.3: Google OAuth Error Leaks Response Body
- **Severity: Low**
- **File:** `backend/src/services/auth.rs`, lines 358-360

### Finding 5.4: Internal Error Messages Are Properly Redacted (Positive)

## 6. DEPENDENCIES

### Finding 6.1: Dependencies Are Reasonably Current
- **Severity: Low**
- **Suggested fix:** Run `cargo audit` and `npm audit` in CI.

## 7. ADDITIONAL FINDINGS

### Finding 7.1: Email Enumeration via Magic Link Login Endpoint
- **Severity: Medium**
- **File:** `backend/src/handlers/auth.rs`, lines 55-68
- **Description:** Login returns 404 for unknown emails, register always succeeds. This allows email enumeration.

### Finding 7.2: Magic Link Token Not Scoped to Registration vs Login
- **Severity: Low**
- **File:** `backend/src/services/auth.rs`, lines 240-292

### Finding 7.3: No Security Headers (HSTS, X-Content-Type-Options, etc.)
- **Severity: Medium**
- **File:** `backend/src/routes.rs`
- **Suggested fix:** Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

## Summary Table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1.1 | Google ID token not verified, `aud` not checked | Critical | AuthN |
| 3.3 | Refresh token in localStorage (XSS exfiltration risk) | High | Session Mgmt |
| 5.1 | `.env` file with secrets present in repo | High | Secrets |
| 1.2 | Magic link email parameter not URL-encoded | Medium | AuthN |
| 1.4 | `active_role` in JWT not re-verified per request | Medium | AuthZ |
| 3.4 | Listing status field not validated on update | Medium | Input Validation |
| 3.5 | Public profiles expose contact_email without auth | Medium | Data Exposure |
| 3.6 | No per-email rate limit on magic link requests | Medium | Rate Limiting |
| 4.1 | Global rate limiter too permissive for auth endpoints | Medium | Rate Limiting |
| 4.2 | No URL/length validation on profile links | Medium | Input Validation |
| 5.2 | No minimum JWT secret length enforcement | Medium | Secrets |
| 7.1 | Email enumeration via login vs register responses | Medium | AuthN |
| 7.3 | Missing security response headers | Medium | Headers |
| 1.3 | Duplicate application relies on fragile constraint matching | Low | Error Handling |
| 1.5 | Switch role doesn't invalidate old refresh tokens | Low | Session Mgmt |
| 2.1 | `format!` for table names (currently safe, pattern fragile) | Low | SQL Injection |
| 4.3 | No limit on number of profile links | Low | Input Validation |
| 5.3 | Google OAuth error leaks response body | Low | Info Leakage |
| 7.2 | Magic link tokens not scoped to register vs login | Low | AuthN |
| 6.1 | Dependencies reasonably current; run audit in CI | Low | Dependencies |
