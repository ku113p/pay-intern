# Frontend: Пробелы и рекомендации

[← Назад](../README.md)

## Критичные (Stage 1)

### 1. BUG: LoginForm role hardcode
`components/auth/LoginForm.tsx:13` — `authApi.requestMagicLink(email, 'developer')`.
Новый company user через /login создаётся как developer.

### 2. ApplicationList UUID display
`components/applications/ApplicationList.tsx:42,68` — показывает `listing_id.slice(0,8)...` и `applicant_id.slice(0,8)...`.
Нужны человекочитаемые данные (listing title, applicant name) — требует backend JOIN.

### 3. Нет страницы управления листингами
Backend endpoints готовы (PUT, DELETE). API клиент готов (update, delete в `api/listings.ts`). Нет UI.
Пользователь не может: исправить опечатку, закрыть листинг, увидеть все свои листинги в одном месте.

## Важные (Stage 2)

### 4. Нет toast notifications
Весь feedback — inline div-ы, пропадают при навигации. Рекомендация: `react-hot-toast`.

### 5. Нет текстового поиска
Только фильтры (tech, format, price, experience). Нет поиска по ключевому слову.
`useDebounce` хук готов, не используется.

### 6. Review UI не подключен
ReviewForm и ReviewDisplay компоненты готовы. API клиент готов. Нет страницы, нет роута, нет точки входа (кнопка в ApplicationList).

### 7. Error boundaries
Любая ошибка рендера → белый экран без feedback.

### 8. Нет withdraw заявки
Кнопки Accept/Reject есть (для owner), Withdraw для applicant — нет.

## Желательные (Stage 3+)

### 9. Google OAuth кнопка
Backend POST /auth/google готов. `authApi.googleAuth()` готов. Кнопки в UI нет.

### 10. Нет тестов
Zero test coverage. Нет vitest, нет @testing-library/react.

### 11. Нет analytics
Нет tracking events, нет PostHog/Plausible/GA.

## Не нужно для MVP

- **UI component library (shadcn)** — Tailwind inline достаточен
- **Form validation library** — HTML5 + backend validator OK
- **Internationalization** — один язык достаточен
- **Dark mode** — косметика
- **Animations/transitions** — косметика
- **PWA support** — не нужно на старте

## Ключевые файлы для модификации

| Файл | Что менять |
|------|-----------|
| `components/auth/LoginForm.tsx` | Убрать hardcoded role |
| `components/applications/ApplicationList.tsx` | Human-readable data, withdraw, review button |
| `components/listings/ListingForm.tsx` | Edit mode (initialValues) |
| `components/listings/FeedFilters.tsx` | Search input |
| `App.tsx` | Новые роуты, ErrorBoundary, Toaster |
| `components/layout/Header.tsx` | My Listings ссылка |
| `api/applications.ts` | Updated interface, withdraw method |
| `hooks/useFeedFilters.ts` | Search param + debounce |
