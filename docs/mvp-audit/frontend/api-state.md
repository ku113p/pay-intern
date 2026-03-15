# Frontend: API интеграция и State

[← Назад](../README.md)

## API клиент

### Axios Instance (`api/client.ts`)
- baseURL: `/api`
- **Request interceptor:** добавляет `Authorization: Bearer {token}` из Zustand store
- **Response interceptor:** при 401 → автоматический token refresh → retry original request
- Request queuing: предотвращает множественные refresh вызовы одновременно
- При неудачном refresh → logout + redirect на /login

### API модули (5)

**`api/auth.ts`** — authApi
- `googleAuth(code, role)` — POST /auth/google
- `requestMagicLink(email, role)` — POST /auth/magic-link/request
- `verifyMagicLink(email, token)` — POST /auth/magic-link/verify
- `refresh(refreshToken)` — POST /auth/refresh
- `logout()` — POST /auth/logout

**`api/listings.ts`** — listingsApi
- `create(data)` — POST /listings
- `getById(id)` — GET /listings/{id}
- `update(id, data)` — PUT /listings/{id} (не используется в UI!)
- `delete(id)` — DELETE /listings/{id} (не используется в UI!)
- `getMyListings(params)` — GET /listings/mine
- `getDeveloperFeed(params)` — GET /listings/feed/developers
- `getCompanyFeed(params)` — GET /listings/feed/companies

**`api/applications.ts`** — applicationsApi
- `create(data)` — POST /applications
- `getMine(params)` — GET /applications
- `updateStatus(id, status)` — PUT /applications/{id}/status

**`api/profiles.ts`** — profilesApi
- `getMe()` — GET /users/me
- `updateMe(data)` — PUT /users/me
- `getDeveloperProfile()` / `updateDeveloperProfile(data)`
- `getCompanyProfile()` / `updateCompanyProfile(data)`
- `getPublicDeveloperProfile(id)` / `getPublicCompanyProfile(id)`

**`api/reviews.ts`** — reviewsApi
- `create(data)` — POST /outcome-reviews
- `getById(id)` — GET /outcome-reviews/{id}
- `consent(id, data)` — PUT /outcome-reviews/{id}/consent

### Backend endpoints НЕ подключены в UI
| Endpoint | API клиент | UI |
|----------|-----------|-----|
| PUT /listings/{id} | Есть | Нет формы |
| DELETE /listings/{id} | Есть | Нет кнопки |
| POST /auth/google | Есть | Нет кнопки |
| POST /outcome-reviews | Есть | Нет страницы |
| PUT /outcome-reviews/{id}/consent | Есть | Нет UI |

## React Query Hooks (4)

**`hooks/useListings.ts`**
- `useDeveloperFeed(params)` — GET developer feed с кэшированием
- `useCompanyFeed(params)` — GET company feed
- `useListing(id)` — GET single listing
- `useMyListings(params)` — GET user's listings

**`hooks/useAuth.ts`**
- Инициализация auth при mount: если refresh token в localStorage → refresh → fetch user

**`hooks/useFeedFilters.ts`**
- URL-based filter state (URLSearchParams)
- Синхронизация фильтров с URL для shareable links
- Поддержка: format, tech, min/max_weeks, min/max_price, experience_level, sort, page

**`hooks/useDebounce.ts`**
- Generic debounce utility
- НЕ используется в UI (подготовлен для search)

## State Management

### Zustand Store (`stores/auth.ts`)
```typescript
interface AuthState {
  accessToken: string | null;    // В памяти only
  refreshToken: string | null;   // localStorage
  user: UserResponse | null;
  isAuthenticated: boolean;
  setTokens(access, refresh): void;
  setUser(user): void;
  logout(): void;
}
```

### Что где хранится
| Данные | Где | Почему |
|--------|-----|--------|
| Access token | Zustand (память) | Безопасность — не сохраняется |
| Refresh token | localStorage | Persistence между сессиями |
| User info | Zustand | Быстрый доступ |
| Listings cache | React Query | Автоматический stale/refetch |
| Filters | URL params | Shareable links |
| Form state | useState | Component-local |

### Чего не хватает
- Global toast/notification state
- User preferences store
- Application-level error state
