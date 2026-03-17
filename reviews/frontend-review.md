# Frontend Code Review Report

## 1. BUGS & LOGIC ERRORS

### Finding 1 -- `tech` vs `skills` field mismatch in feed filters
- **Severity: High**
- **File:** `frontend/src/hooks/useFeedFilters.ts`, line 11
- **Description:** The `useFeedFilters` hook reads `tech` from URL search params and sets it on the `filters` object as `tech`, but `ListingFeedParams` (defined in `frontend/src/api/listings.ts`, line 40) has a `skills` field, not `tech`. Meanwhile, `FeedFilters.tsx` reads and writes `filters.skills`. The `tech` field in `ListingFeedParams` exists but `FeedFilters` never sets it. So the URL param `tech` is read into `filters.tech`, which is sent to the API, but the UI skills filter writes to `filters.skills` (which is not synced back to the URL as `tech`). This creates a disconnect: the skills filter from the URL and the skills filter from the UI operate on different fields.
- **Suggested fix:** Decide on one field name. Either rename `tech` to `skills` in `ListingFeedParams` and `useFeedFilters`, or update `FeedFilters` to use `tech`.

### Finding 2 -- `SaveButton` optimistic update uses stale closure for mutation argument
- **Severity: High**
- **File:** `frontend/src/components/listings/SaveButton.tsx`, line 30
- **Description:** `handleClick` captures the current `saved` state and passes it as the mutation argument. The button has no `disabled` guard during pending state, allowing rapid double-clicks that can desync the UI from the server. The same applies to `InterestButton.tsx` line 49.
- **Suggested fix:** Add `disabled={toggleMutation.isPending}` to both buttons to prevent rapid toggling during in-flight requests.

### Finding 3 -- `ProtectedRoute` renders children during token refresh
- **Severity: High**
- **File:** `frontend/src/components/auth/ProtectedRoute.tsx`, lines 4-12
- **Description:** When a user has a `refreshToken` but no `accessToken` (i.e., page refresh), `ProtectedRoute` renders `children` immediately because `!isAuthenticated && !refreshToken` is false. The children will attempt to fetch data, get 401 errors, and trigger the refresh interceptor. This means protected pages briefly render in an unauthenticated state and fire failing API calls before auth is restored.
- **Suggested fix:** Add a loading state: if `refreshToken` exists but `!isAuthenticated`, render a loading spinner instead of the children.

### Finding 4 -- `ListingDetailPage` exhaustive deps mismatch in useEffect
- **Severity: Medium**
- **File:** `frontend/src/pages/ListingDetailPage.tsx`, line 15
- **Description:** The `useEffect` callback references `listing`, but the dependency array uses `[listing?.id, listing?.author_role]`. Functionally acceptable but violates exhaustive-deps rule.
- **Suggested fix:** Add an eslint-disable comment documenting why, or destructure the values before the effect.

### Finding 5 -- `PublicProfilePage` uses raw `useEffect` instead of React Query
- **Severity: Medium**
- **File:** `frontend/src/pages/PublicProfilePage.tsx`, lines 12-19
- **Description:** Data fetching uses a raw `useEffect` with `useState`, which lacks request cancellation, caching, and proper loading state on param change.
- **Suggested fix:** Use `useQuery` from React Query.

### Finding 6 -- `MagicLinkVerifyPage` fires verification twice in StrictMode
- **Severity: Medium**
- **File:** `frontend/src/pages/MagicLinkVerifyPage.tsx`, lines 12-29
- **Description:** In React 18+ StrictMode, effects run twice in development. This `useEffect` calls a POST request that likely invalidates the token on first use.
- **Suggested fix:** Use a ref to track whether verification has already been initiated, or use React Query's `useMutation`.

### Finding 7 -- `LoginForm` has no loading/disabled state during submission
- **Severity: Medium**
- **File:** `frontend/src/components/auth/LoginForm.tsx`, lines 9-17, 46-49
- **Description:** The submit handler is async but there is no loading state, so the button can be clicked multiple times, sending multiple magic link emails.
- **Suggested fix:** Add a `loading` state, disable the button during submission.

### Finding 8 -- `failedQueue` in API client is populated but never used correctly
- **Severity: Medium**
- **File:** `frontend/src/api/client.ts`, lines 45-59, 70-74, 79-83
- **Description:** The `failedQueue` array and `processQueue` function exist but are dead code. Requests during refresh chain on `activeRefreshPromise` directly.
- **Suggested fix:** Remove `failedQueue` and `processQueue`.

## 2. PERFORMANCE

### Finding 9 -- No route-level code splitting (lazy loading)
- **Severity: Medium**
- **File:** `frontend/src/App.tsx`, lines 1-23
- **Description:** All 15+ page components are eagerly imported. Users visiting the login page download the entire app bundle.
- **Suggested fix:** Use `React.lazy()` and `<Suspense>` for route-level code splitting.

### Finding 10 -- `ListingCard` creates a new `useNavigate` hook per card
- **Severity: Low**
- **File:** `frontend/src/components/listings/ListingCard.tsx`, line 9
- **Description:** `useNavigate()` is called in every `ListingCard` instance. Minor concern.

### Finding 11 -- `ListingDetail` always fetches similar listings even when not visible
- **Severity: Low**
- **File:** `frontend/src/components/listings/ListingDetail.tsx`, lines 23-26
- **Description:** The `useQuery` for similar listings fires immediately on mount regardless of visibility.

### Finding 12 -- `MessagesPage` re-renders and scrolls on every poll cycle
- **Severity: Medium**
- **File:** `frontend/src/pages/MessagesPage.tsx`, lines 43-45
- **Description:** The `useEffect` scrolls to the bottom every time `messages` changes, including when polling returns the same data.
- **Suggested fix:** Only scroll when new messages are actually added.

### Finding 13 -- i18n bundles are eagerly loaded for all languages
- **Severity: Low**
- **File:** `frontend/src/i18n/index.ts`, lines 5-10
- **Description:** All three language bundles (en, ru, es) are statically imported.

## 3. API LAYER

### Finding 14 -- No request cancellation on component unmount
- **Severity: Medium**
- **Description:** No API calls use `AbortController`. Raw `useEffect`-based calls don't handle unmount.

### Finding 15 -- Hard redirect to `/login` in 401 interceptor
- **Severity: Medium**
- **File:** `frontend/src/api/client.ts`, line 84
- **Description:** `window.location.href = '/login'` causes a full page reload, losing all client-side state.
- **Suggested fix:** Use the router's `navigate` function instead.

### Finding 16 -- `ApplicationList` has no pagination
- **Severity: Low**
- **File:** `frontend/src/components/applications/ApplicationList.tsx`, lines 13-14, 17-19
- **Description:** Queries request `per_page: 20` but there is no pagination UI.

## 4. TYPESCRIPT

### Finding 17 -- Pervasive use of `catch (err: any)` instead of proper error typing
- **Severity: Medium**
- **Files:** `LoginForm.tsx:14`, `ListingForm.tsx:74`, `ListingDetail.tsx:36`, `ReviewForm.tsx:37`, `DeveloperProfileForm.tsx:58`, `CompanyProfileForm.tsx:58`, `ProfilePage.tsx:38`
- **Description:** Seven files use `catch (err: any)` bypassing type checking.
- **Suggested fix:** Use `isAxiosError` type guard or create a shared `getErrorMessage` helper.

### Finding 18 -- Untyped `_skipAuthRetry` property on axios config
- **Severity: Low**
- **File:** `frontend/src/api/auth.ts`, line 25
- **Description:** `{ _skipAuthRetry: true } as never` is a type escape hatch.

### Finding 19 -- `ListingFeedParams` has a `tech` field that is never used by the UI
- **Severity: Low**
- **File:** `frontend/src/api/listings.ts`, line 40

## 5. UX ISSUES

### Finding 20 -- Minimal accessibility (a11y)
- **Severity: High**
- **Description:** Only the `Header.tsx` hamburger button has `aria-label` and `aria-expanded`. The rest of the app has virtually no ARIA attributes: no `role="menu"`, no `htmlFor`/`id` pairing on form labels, no tab ARIA patterns.

### Finding 21 -- No error boundary below the route level
- **Severity: Medium**
- **File:** `frontend/src/App.tsx`, lines 33-66
- **Description:** A single `ErrorBoundary` wraps the entire app. Component errors crash the whole UI.

### Finding 22 -- `ProfilePage` display name state not synced with store updates
- **Severity: Medium**
- **File:** `frontend/src/pages/ProfilePage.tsx`, line 15
- **Description:** `displayName` is initialized from `user?.display_name` at mount time and never syncs.

### Finding 23 -- No "back to conversation list" visible on desktop in Messages
- **Severity: Low**
- **File:** `frontend/src/pages/MessagesPage.tsx`, line 109

### Finding 24 -- `NotificationsPage` has duplicate padding with Layout
- **Severity: Low**
- **File:** `frontend/src/pages/NotificationsPage.tsx`, line 42

## 6. ARCHITECTURE & CODE QUALITY

### Finding 25 -- Duplicated `paymentLabel` / `paymentColor` logic
- **Severity: Medium**
- **Files:** `frontend/src/components/listings/ListingCard.tsx` (lines 11-23), `frontend/src/components/listings/ListingDetail.tsx` (lines 43-62)

### Finding 26 -- Duplicated skill input + chip pattern
- **Severity: Low**
- **Files:** `ListingForm.tsx`, `DeveloperProfileForm.tsx`, `CompanyProfileForm.tsx`

### Finding 27 -- Profile forms use raw `useEffect` instead of React Query
- **Severity: Medium**
- **Files:** `frontend/src/components/profiles/DeveloperProfileForm.tsx`, `frontend/src/components/profiles/CompanyProfileForm.tsx`

### Finding 28 -- `Toaster` is rendered outside `BrowserRouter`
- **Severity: Low**
- **File:** `frontend/src/App.tsx`, line 65

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 3 |
| Medium | 13 |
| Low | 13 |
