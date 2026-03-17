# TODO

## Pending: Google OAuth Frontend
Add Google Sign-In button to the login page. Backend already has `POST /auth/google` endpoint working. Frontend has `authApi.googleAuth(code)` wired up. Just needs UI + callback page.

### Files to create/modify:
- Create `frontend/src/pages/GoogleCallbackPage.tsx` (model after MagicLinkVerifyPage)
- Edit `frontend/src/components/auth/LoginForm.tsx` (add Google button + "or" divider)
- Edit `frontend/src/App.tsx` (add `/auth/google/callback` route)
- Create `frontend/.env.example` (add `VITE_GOOGLE_CLIENT_ID`)
- Edit `backend/.env.example` (fix `GOOGLE_REDIRECT_URI` to point to frontend :5173)

### Notes:
- Zero new dependencies -- redirect-based OAuth, no Google JS library
- Add `state` parameter for CSRF protection
- `VITE_GOOGLE_CLIENT_ID` controls visibility -- button hidden if not set
- redirect_uri must match in Google Cloud Console, frontend URL, and backend env var

## Remaining Review Items (deferred)
- Google ID token signature verification (defense-in-depth, not strictly required)
- Refresh token to HttpOnly cookie (architecture change)
- Accessibility (ARIA roles, labels across components)
- Route-level code splitting (React.lazy)
- Hard redirect on auth failure (window.location.href)
- Duplicated listing SELECT SQL / pagination helpers (refactoring)
- Pagination for interests/matches/conversations endpoints
- SQLite backup strategy
