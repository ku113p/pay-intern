# Backend: Security и тестирование

[← Назад](../README.md)

## Security: что хорошо

- **Раздельные JWT секреты** для access и refresh токенов
- **Token hashing:** refresh tokens хранятся как SHA-256 hash
- **Family-based theft detection:** повторное использование revokes всю семью
- **Request body limit:** 1MB (tower-http)
- **Input validation:** validator crate на request DTOs
- **Ownership checks:** listing update/delete, application status — только owner
- **Visibility enforcement:** public/authenticated/private на листингах
- **Role-based access:** developers → company listings, companies → developer listings
- **Foreign key CASCADE:** удаление user каскадирует на все связанные данные

## Security: проблемы

### CORS (критично)
```rust
// backend/src/routes.rs:12-15
let cors = CorsLayer::new()
    .allow_origin(Any)      // Любой сайт может делать запросы
    .allow_methods(Any)
    .allow_headers(Any);
```
С Bearer-токенами риск ниже чем с cookies, но всё равно позволяет любому сайту пробовать API.

**Fix:** Читать origin из env, `AllowOrigin::exact(config.cors_origin)`.

### Rate Limiting (важно)
- Global: 2 req/sec sustained, burst 20 (tower_governor)
- Нет per-endpoint лимитов
- Auth endpoints (magic link request) не ограничены дополнительно
- Можно спамить magic link emails

### SQL interpolation (низкий риск)
```rust
// backend/src/services/listing.rs:225-236
if let Some(min_weeks) = query.min_weeks {
    where_clauses.push(format!("l.duration_weeks >= {min_weeks}"));
}
```
Безопасно из-за Rust types (i32/f64), но плохая практика. Рефактор приоритет — низкий.

### Отсутствует
- Brute force protection на magic links
- CSRF protection (stateless API, Bearer auth — риск минимален)
- Content Security Policy headers (только nginx уровень)
- Request IDs для debugging
- Account lockout после неудачных попыток

## Error Handling

### AppError enum (`backend/src/error.rs`)
```
BadRequest(String)    → 400
Unauthorized(String)  → 401
Forbidden(String)     → 403
NotFound(String)      → 404
Conflict(String)      → 409
RateLimited           → 429
Internal(String)      → 500
Validation(String)    → 422
```

- JSON response: `{"error": "message"}`
- Internal errors логируются через tracing, не раскрывают детали клиенту
- From impls: sqlx::Error, jsonwebtoken::errors::Error, validator::ValidationErrors

## Тестирование

### Текущее покрытие: ~5%

**4 unit-теста в `backend/src/auth/jwt.rs`:**
- Token generation + parsing roundtrip
- Role preservation in claims
- Secret validation (wrong secret → error)
- Token hash consistency

### Что отсутствует
- Integration tests для handlers (axum-test v16 в dev-deps, не используется)
- Service-level unit tests
- Database migration tests
- Validation edge case tests
- Authorization/ownership tests
- E2E API tests

### Рекомендуемая структура
```
backend/tests/
├── integration/
│   ├── auth_test.rs
│   ├── listings_test.rs
│   ├── applications_test.rs
│   └── profiles_test.rs
└── helpers/
    └── fixtures.rs
```
