# Backend: Auth система

[← Назад](../README.md)

## JWT токены

### Access Token (15 мин)
- Algorithm: HS256
- Claims: user_id (sub), role, exp
- Отдельный секрет от refresh token
- Передаётся в `Authorization: Bearer` header

### Refresh Token (7 дней)
- Algorithm: HS256
- Claims: user_id (sub), family_id, exp
- Отдельный секрет от access token
- **SHA-256 хэш** хранится в БД (raw никогда не сохраняется)
- Family-ID tracking для stolen-token detection

### Token Rotation Flow
1. Client отправляет refresh token
2. Backend ищет hash в БД, проверяет expiry
3. Если найден → удаляет старый, выдаёт новую пару (та же family)
4. Если НЕ найден → **повторное использование detected** → revoke ВСЮ family
5. Это защита от stolen tokens (если атакующий использовал token раньше легитимного юзера)

**Файл:** `backend/src/services/auth.rs:58-134`

## Magic Link Auth

1. `POST /auth/magic-link/request` — принимает email + role
2. Генерирует random token, хэширует SHA-256, сохраняет в `magic_link_tokens`
3. Отправляет email с ссылкой `{MAGIC_LINK_BASE_URL}?token={raw}&email={email}`
4. Token expires через 15 минут, одноразовый (used=1 после верификации)
5. `POST /auth/magic-link/verify` — проверяет hash, находит/создаёт юзера

**Файлы:** `backend/src/services/auth.rs:146-200`, `backend/src/services/email.rs`

## Google OAuth

1. `POST /auth/google` — принимает authorization code + role
2. Обменивает code на id_token через Google API
3. Декодирует JWT payload (sub, email, name)
4. Ищет по `auth_provider='google' AND auth_provider_id=sub`
5. Если найден → возвращает user
6. Если email совпадает с magic link user → линкует Google аккаунт
7. Если новый → создаёт user + profile

**Файл:** `backend/src/services/auth.rs:269-382`

## Middleware Extractors

### `AuthUser` (required)
- Извлекает Bearer token из Authorization header
- Декодирует access token, возвращает user_id + role
- 401 если нет токена или невалидный

### `OptionalAuthUser`
- Тот же процесс, но возвращает `Option`
- Используется для public endpoints с visibility rules

**Файл:** `backend/src/auth/middleware.rs`

## Известные проблемы

1. **Login bug:** Frontend LoginForm хардкодит role='developer' — новые company users через /login получают неправильную роль
2. **Нет email verification:** Magic link = implicit verification, но нет отдельного шага
3. **Нет account deletion:** Юзер не может удалить аккаунт
4. **Нет per-endpoint rate limiting:** Global 2 req/sec, нет отдельных лимитов для auth
5. **Magic link brute force:** Нет ограничения на количество запросов magic link для одного email
