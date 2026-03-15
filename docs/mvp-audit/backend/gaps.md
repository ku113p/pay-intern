# Backend: Пробелы и рекомендации

[← Назад](../README.md)

## Критичные (Stage 1)

### 1. Login bug — role hardcode
`LoginForm.tsx:13` отправляет `role='developer'` всегда. Backend `find_or_create_email_user` создаёт нового user с этой ролью. Существующие users не затронуты.

### 2. ApplicationList response — нет JOIN
`get_applications` в `services/application.rs` возвращает raw application rows. Frontend показывает `listing_id.slice(0,8)...`. Нужен JOIN как в `get_feed` (listing.rs:273-284).

### 3. CORS allow_origin(Any)
`routes.rs:12-15`. Заменить на конкретный origin из config.

### 4. Duplicate application — сырая ошибка
UNIQUE constraint есть (migration 004:9), но при violation → raw sqlx error. Нужен graceful `AppError::Conflict`.

## Важные (Stage 2)

### 5. Application withdrawal
Нет withdraw endpoint. Пользователь не может отозвать pending заявку. Нужен новый status 'withdrawn' (SQLite не поддерживает ALTER CHECK — валидировать в коде).

### 6. Email notifications
Email сервис работает (magic links), но нет уведомлений о:
- Новой заявке → listing owner
- Accept/reject → applicant
- Новом review → developer

### 7. Text search
Нет поиска по title/description в feed. Нужен параметр `search` с LIKE clause.

## Желательные (Stage 3)

### 8. Account deletion (GDPR)
Нет DELETE /users/me. Нужен cascade: закрыть листинги, анонимизировать заявки, удалить профиль, отозвать токены.

### 9. In-app messaging
После accept заявки нет способа общаться внутри платформы. Новая таблица messages, scoped к accepted applications.

## Не нужно для MVP

- **Admin panel** — ручное управление через SQLite CLI при < 100 users
- **Full-text search (FTS5)** — LIKE достаточен для MVP
- **2FA/MFA** — magic link + OAuth достаточны
- **Password auth** — нет паролей by design
- **Review editing** — immutable reviews OK для MVP
- **Saved/bookmarked listings** — post-MVP feature

## Ключевые файлы для модификации

| Файл | Что менять |
|------|-----------|
| `services/auth.rs` | Login flow separation |
| `services/application.rs` | JOIN, withdraw, duplicate handling |
| `services/email.rs` | Notification emails |
| `services/user.rs` | Account deletion |
| `models/application.rs` | Enriched response DTO |
| `routes.rs` | CORS config, new routes |
| `config.rs` | CORS_ORIGIN env var |
| `handlers/applications.rs` | Withdraw handler |
