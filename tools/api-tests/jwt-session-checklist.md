# JWT Active Session — Verification Checklist

All checks below apply when you have received a JWT access token with an active session.

Obtain a fresh token by logging in and copying the `access_token` from `POST /auth/login` response.

---

## 1. Access Token Format & Cryptographic Checks

| # | Check | Expected |
|---|-------|----------|
| 1.1 | Token has 3 Base64URL parts separated by `.` | ✓ 3 segments |
| 1.2 | Header `alg` is `HS256` (not `none`, not `RS256`) | `"alg":"HS256"` |
| 1.3 | Signature is valid against `JWT_ACCESS_SECRET` | `decode_access_token()` succeeds |
| 1.4 | Token is not expired (`exp` > now) | 200, not 401 `"Token expired"` |
| 1.5 | `sub` claim is a valid UUID | `Uuid::parse_str` succeeds in middleware |
| 1.6 | `active_role` is exactly `"individual"` or `"organization"` | No other value accepted |
| 1.7 | Access token rejected at `POST /auth/refresh` (wrong secret) | 401 |

---

## 2. User State Checks (`users` table)

| # | SQL / Check | Expected |
|---|-------------|----------|
| 2.1 | `SELECT * FROM users WHERE id = '<sub>'` | Row exists |
| 2.2 | `deleted_at IS NULL` | User not soft-deleted |
| 2.3 | `email` is not NULL | Has valid email |
| 2.4 | `auth_provider IN ('email', 'google')` | Matches CHECK constraint |
| 2.5 | If `auth_provider = 'google'` → `auth_provider_id IS NOT NULL` | Google sub present |

---

## 3. Active Role vs Profile Existence (`individual_profiles` / `organization_profiles`)

| # | Check | Expected |
|---|-------|----------|
| 3.1 | `active_role = "individual"` → `SELECT * FROM individual_profiles WHERE user_id = '<sub>'` | Row exists |
| 3.2 | `active_role = "organization"` → `SELECT * FROM organization_profiles WHERE user_id = '<sub>'` | Row exists |
| 3.3 | `GET /users/me` → `has_individual_profile` matches DB row presence | Values match |
| 3.4 | `GET /users/me` → `has_organization_profile` matches DB row presence | Values match |
| 3.5 | User can have both profiles simultaneously (dual-role) | No constraint error on inserting both |

---

## 4. Refresh Token DB State (`refresh_tokens` table)

| # | SQL / Check | Expected |
|---|-------------|----------|
| 4.1 | `SELECT * FROM refresh_tokens WHERE user_id = '<sub>'` | At least 1 row |
| 4.2 | `WHERE expires_at > datetime('now')` | Active (non-expired) row exists |
| 4.3 | `token_hash = SHA256(raw_refresh_token)` | Hash matches token sent by client |
| 4.4 | `family_id` in DB row matches `family_id` in refresh JWT claims | Values match |
| 4.5 | `SELECT COUNT(*) FROM refresh_tokens WHERE family_id = '<fid>'` | Exactly 1 (single-use rotation) |
| 4.6 | `token_hash` is UNIQUE across all rows | No duplicate hash |
| 4.7 | After `POST /auth/refresh`: old `token_hash` row gone, new one inserted with same `family_id` | Before/after compare |
| 4.8 | `user_id` in token row → JOIN to `users` returns non-deleted user | FK integrity |

---

## 5. Stolen-Token Detection (Family ID)

| # | Scenario | Expected |
|---|----------|----------|
| 5.1 | Replay an already-rotated refresh token | 401 |
| 5.2 | After replay: `SELECT * FROM refresh_tokens WHERE family_id = '<fid>'` | 0 rows (entire family deleted) |
| 5.3 | After family deletion: access token still works until `exp` | 200 (stateless — no revocation) |
| 5.4 | After family deletion: any subsequent `POST /auth/refresh` with family tokens | 401 |
| 5.5 | Role switch → new `family_id`: replay old-family token only deletes old family | New family unaffected |

---

## 6. Session Lifecycle

| # | Check | Expected |
|---|-------|----------|
| 6.1 | After `POST /auth/logout`: `SELECT * FROM refresh_tokens WHERE user_id = '<sub>'` | 0 rows |
| 6.2 | After logout: access token still accepted until `exp` | 200 within 15 min window |
| 6.3 | After `DELETE /users/me`: `refresh_tokens` cascade-deleted | 0 rows (ON DELETE CASCADE) |
| 6.4 | Magic link token: `used = 1` after first login | Single-use enforced |
| 6.5 | Magic link token: `expires_at` is 15 minutes from `created_at` | Timestamp diff = 900s |
| 6.6 | Expired access token → response | 401 `"Token expired"` (not 403, not 500) |

---

## 7. Authorization / Access Control

| # | Check | Endpoint | Expected |
|---|-------|----------|----------|
| 7.1 | `active_role = "individual"` tries to create org listing | `POST /listings` | 403 |
| 7.2 | Listing `visibility = "private"`, request from non-author | `GET /listings/{id}` | 404 or 403 |
| 7.3 | Listing `visibility = "authenticated"`, no token | `GET /listings/{id}` | 401 |
| 7.4 | Listing `visibility = "public"`, no token | `GET /listings/{id}` | 200 |
| 7.5 | Applicant requests contact info | `GET /applications/{id}/contact` | 403 |
| 7.6 | Unrelated user requests message thread | `GET /messages/{application_id}` | 403 |
| 7.7 | Listing owner tries to set review consent | `PUT /outcome-reviews/{id}/consent` | 403 |
| 7.8 | Applicant tries to update application status | `PUT /applications/{id}/status` | 403 |
| 7.9 | User applies to their own listing | `POST /applications` | 400 or 403 |
| 7.10 | Switch to `organization` role without org profile | `POST /auth/switch-role` | 400 or 403 |

---

## 8. DB Join Correctness

| # | Join | What to verify |
|---|------|----------------|
| 8.1 | `listings JOIN users ON author_id = users.id` | `display_name` is correct |
| 8.2 | `listings LEFT JOIN organization_profiles ON author_id = user_id` | `organization_name` present on org listings |
| 8.3 | `listings LEFT JOIN individual_profiles ON author_id = user_id` | `experience_level` present on individual listings |
| 8.4 | `listings LEFT JOIN saved_listings ON (listing_id, user_id)` | `is_saved` flag correct per user |
| 8.5 | `listings LEFT JOIN interests ON (listing_id, user_id)` | `is_interested` flag correct per user |
| 8.6 | `applications JOIN listings ON listing_id` | App response has listing `title` and `author_role` |
| 8.7 | `applications JOIN users ON applicant_id` | App response has `applicant_name` |
| 8.8 | `messages JOIN users ON sender_id` | Message has correct `sender_name` |
| 8.9 | `messages/conversations`: `applications → listings → users → messages` | Last message, listing title, other party name all correct |
| 8.10 | `profile_links WHERE user_id = ? AND profile_type = ?` | Only links for correct profile type returned |
| 8.11 | `outcome_reviews JOIN applications ON application_id` | Review linked to correct application + parties |
| 8.12 | `notifications WHERE user_id = ?` | Only requesting user's notifications returned |

---

## 9. Unique Constraint / Integrity

| # | Constraint | Table |
|---|-----------|-------|
| 9.1 | `UNIQUE(listing_id, applicant_id)` — no double-apply | `applications` |
| 9.2 | `UNIQUE(user_id, listing_id)` — no double-save | `saved_listings` |
| 9.3 | `UNIQUE(user_id, listing_id)` — no double-interest | `interests` |
| 9.4 | `UNIQUE(application_id)` — one review per application | `outcome_reviews` |
| 9.5 | `token_hash UNIQUE` — no duplicate refresh tokens | `refresh_tokens` |
| 9.6 | `email UNIQUE` — no duplicate users | `users` |

---

## 10. Cascade Delete on User Deletion

After `DELETE /users/me` (soft-delete path) or hard delete, verify via SQL:

| # | Table | Check |
|---|-------|-------|
| 10.1 | `refresh_tokens` | 0 rows for `user_id` |
| 10.2 | `individual_profiles` | No row for `user_id` |
| 10.3 | `organization_profiles` | No row for `user_id` |
| 10.4 | `profile_links` | No rows for `user_id` |
| 10.5 | `listings` | No rows for `author_id` |
| 10.6 | `applications` | No rows (cascade via listings) |
| 10.7 | `messages` | No rows (cascade via applications) |
| 10.8 | `notifications` | 0 rows for `user_id` |
| 10.9 | `saved_listings` | 0 rows for `user_id` |
| 10.10 | `interests` | 0 rows for `user_id` |
| 10.11 | `notification_preferences` | No row for `user_id` |

---

## 11. Signing Key Isolation

| # | Check | Expected |
|---|-------|----------|
| 11.1 | Decode access token with `JWT_REFRESH_SECRET` | Fails — invalid signature |
| 11.2 | Decode refresh token with `JWT_ACCESS_SECRET` | Fails — invalid signature |
| 11.3 | `JWT_ACCESS_SECRET == JWT_REFRESH_SECRET` at startup | Rejected by config validation |
| 11.4 | Either secret < 32 bytes | Rejected by config validation |
