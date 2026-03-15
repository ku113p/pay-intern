# MVP Roadmap: 3 стадии

[← Назад к оглавлению](README.md)

## Context

Главный критерий MVP (по [best practices 2026](https://www.valtorian.com/blog/launch-mvp-right-2026/)): один workflow от начала до конца должен давать ценность. Для DevStage: регистрация → фид → заявка → принятие → review. Путь работает, но с UX-дырами.

Лендинг создаётся параллельно — не входит в план.

---

## Stage 1: Launch Blockers (~12-14ч)

На что пользователь наткнётся в первый день.

| # | Задача | Размер | Часы |
|---|--------|--------|------|
| 1.1 | [BUG: LoginForm хардкодит role='developer'](#11-bug-loginform) | S | 0.5 |
| 1.2 | [ApplicationList показывает UUID](#12-applicationlist-uuid) | M | 2-3 |
| 1.3 | [Страница управления листингами](#13-управление-листингами) | L | 4-5 |
| 1.4 | [CORS allow_origin(Any)](#14-cors) | S | 0.5 |
| 1.5 | [Nginx security headers + gzip](#15-nginx) | S | 1 |
| 1.6 | [Graceful error при дубле заявки](#16-дубликат-заявки) | S | 0.5 |

**Порядок:** 1.1 → 1.2 → 1.6 → 1.4 → 1.5 → 1.3

### 1.1 BUG: LoginForm

`frontend/src/components/auth/LoginForm.tsx:13` — `authApi.requestMagicLink(email, 'developer')`. Новый пользователь-компания через /login создаётся как developer. Для существующих — неактуально (`find_or_create_email_user` в `backend/src/services/auth.rs:207` возвращает существующего).

**Решение:** Login не должен создавать users. Если email не найден → ошибка "please register".

**Файлы:** `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/api/auth.ts`, `backend/src/handlers/auth.rs`, `backend/src/services/auth.rs`

### 1.2 ApplicationList UUID

`frontend/src/components/applications/ApplicationList.tsx:42` — `app.listing_id.slice(0, 8)...`. Страница заявок непригодна — пользователь видит обрезанные UUID.

**Решение:** JOIN в backend (паттерн из `backend/src/services/listing.rs:273-284`). Добавить listing_title, applicant_name в response.

**Файлы:** `backend/src/services/application.rs`, `backend/src/models/application.rs`, `frontend/src/api/applications.ts`, `frontend/src/components/applications/ApplicationList.tsx`

### 1.3 Управление листингами

Backend готов: GET /listings/mine, PUT /listings/{id}, DELETE /listings/{id}. Frontend API готов. Нет UI — нельзя исправить опечатку.

**Файлы:** новый `frontend/src/pages/MyListingsPage.tsx`, `frontend/src/App.tsx`, `frontend/src/components/layout/Header.tsx`, `frontend/src/components/listings/ListingForm.tsx` (edit mode)

### 1.4 CORS

`backend/src/routes.rs:12-15` — `allow_origin(Any)`. Заменить на конкретный origin из env.

**Файлы:** `backend/src/config.rs`, `backend/src/routes.rs`, `backend/.env.example`

### 1.5 Nginx

`frontend/nginx.conf` — нет security headers, gzip, кэширования. Добавить: server_tokens off, gzip, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, Cache-Control для /assets/.

**Файлы:** `frontend/nginx.conf`

### 1.6 Дубликат заявки

UNIQUE(listing_id, applicant_id) есть в БД (`backend/migrations/004_create_applications.sql:9`), но повторная подача → сырая ошибка sqlx. Нужен `AppError::Conflict("You have already applied")`.

**Файлы:** `backend/src/services/application.rs`

---

## Stage 2: Core Experience (~14-18ч)

Разница между "технически работает" и "хочется пользоваться".

| # | Задача | Размер | Часы |
|---|--------|--------|------|
| 2.1 | Toast-уведомления | M | 2 |
| 2.2 | Текстовый поиск | M | 2-3 |
| 2.3 | UI для outcome reviews | L | 4-5 |
| 2.4 | Error boundaries | S | 0.5 |
| 2.5 | Withdraw заявки | M | 2 |
| 2.6 | Email-нотификации | L | 3-4 |

**Порядок:** 2.4 → 2.1 → 2.2 → 2.5 → 2.3 → 2.6

**2.1 Toast:** react-hot-toast (~5kb). Заменить inline div-ы на toast.success()/error().

**2.2 Поиск:** Параметр `search` в feed, SQLite LIKE по title+description. useDebounce хук уже есть (`frontend/src/hooks/useDebounce.ts`), не используется.

**2.3 Reviews:** ReviewForm и ReviewDisplay компоненты готовы, API готов — нужна страница и кнопка "Write Review" в ApplicationList для accepted.

**2.4 Error boundaries:** ErrorBoundary компонент, обернуть Routes в App.tsx.

**2.5 Withdraw:** Новый статус 'withdrawn' (SQLite не поддерживает ALTER CHECK — валидировать в коде). Кнопка Withdraw для pending заявок.

**2.6 Email:** Переиспользовать паттерн send_magic_link_email. Три уведомления: новая заявка → owner, accept/reject → applicant, review → developer.

---

## Stage 3: Growth Readiness (~14-18ч)

Инфраструктура и фичи для удержания.

| # | Задача | Размер | Часы |
|---|--------|--------|------|
| 3.1 | Аналитика | M | 2-3 |
| 3.2 | HTTPS/TLS | M | 2-3 |
| 3.3 | Бэкапы SQLite | S | 1 |
| 3.4 | Удаление аккаунта (GDPR) | M | 2-3 |
| 3.5 | In-app сообщения | L | 5-6 |
| 3.6 | Автодеплой | M | 2 |

**Порядок:** 3.1 → 3.2 → 3.3 → 3.4 → 3.6 → 3.5

**3.1 Аналитика:** PostHog/Plausible. Минимальные events: listing_viewed, application_sent.

**3.2 HTTPS:** Caddy (auto-TLS) или nginx + certbot sidecar.

**3.3 Бэкапы:** `sqlite3 .backup` скрипт + ротация 7 дней.

**3.4 GDPR:** DELETE /users/me — cascade: закрыть листинги, анонимизировать заявки, удалить профиль, отозвать токены.

**3.5 Сообщения:** Killer feature. Таблица messages, scoped к accepted applications. Новые эндпоинты, ConversationPage.

**3.6 Автодеплой:** GitHub Actions deploy job: SSH → docker compose pull && up -d.

---

## Итого

| Стадия | Фокус | Задач | Часы |
|--------|-------|-------|------|
| 1 | Launch blockers | 6 | 12-14 |
| 2 | Core experience | 6 | 14-18 |
| 3 | Growth readiness | 6 | 14-18 |
| **Всего** | | **18** | **40-50** |

## Не входит в план

- **Лендинг** — параллельно
- **Google OAuth UI** — magic link достаточен для launch
- **Тесты** — итеративно после Stage 1
- **Admin panel** — не нужен при < 100 users
- **Form validation lib** — HTML5 + backend validator достаточны
