# Backend: Endpoints и архитектура

[← Назад](../README.md)

## Архитектура

Три слоя: **handlers → services → database (sqlx)**

```
src/
├── auth/          JWT, middleware, extractors
├── handlers/      6 файлов — HTTP layer
├── services/      6 файлов — business logic + DB queries
├── models/        5 файлов — DTOs, DB row structs
├── middleware/     Rate limiting
├── routes.rs      Все роуты (build_router)
├── config.rs      Env config
├── db.rs          Dual SQLite pools (read 5 / write 1)
├── error.rs       AppError enum → IntoResponse
└── main.rs        Tokio runtime, signal handling
```

**Shared state:**
```rust
pub struct AppState {
    pub read_db: SqlitePool,   // GET operations
    pub write_db: SqlitePool,  // POST/PUT/DELETE
    pub config: Arc<Config>,
}
```

## Все endpoints (26)

### Auth (`/auth`)
| Method | Path | Auth | Описание |
|--------|------|------|----------|
| POST | `/google` | - | Google OAuth code exchange |
| POST | `/magic-link/request` | - | Запрос magic link |
| POST | `/magic-link/verify` | - | Верификация magic link |
| POST | `/refresh` | - | Refresh token rotation |
| POST | `/logout` | AuthUser | Revoke всех refresh tokens |

### Users (`/users`)
| Method | Path | Auth | Описание |
|--------|------|------|----------|
| GET | `/me` | AuthUser | Текущий пользователь |
| PUT | `/me` | AuthUser | Обновить display_name |

### Profiles (`/profiles`)
| Method | Path | Auth | Описание |
|--------|------|------|----------|
| GET | `/developer` | AuthUser | Мой dev profile |
| PUT | `/developer` | AuthUser | Обновить dev profile |
| GET | `/company` | AuthUser | Мой company profile |
| PUT | `/company` | AuthUser | Обновить company profile |
| GET | `/developer/{id}` | Optional | Публичный dev profile |
| GET | `/company/{id}` | Optional | Публичный company profile |

### Listings (`/listings`)
| Method | Path | Auth | Описание |
|--------|------|------|----------|
| POST | `/` | AuthUser | Создать листинг |
| GET | `/mine` | AuthUser | Мои листинги |
| GET | `/{id}` | Optional | Просмотр (visibility check) |
| PUT | `/{id}` | AuthUser | Обновить (owner only) |
| DELETE | `/{id}` | AuthUser | Soft delete → status=closed |
| GET | `/feed/developers` | Optional | Фид dev листингов |
| GET | `/feed/companies` | AuthUser | Фид company листингов |

**Feed фильтры:** tech, format, min/max_weeks, min/max_price, experience_level, sort (price_asc/desc/created_at)

### Applications (`/applications`)
| Method | Path | Auth | Описание |
|--------|------|------|----------|
| POST | `/` | AuthUser | Подать заявку |
| GET | `/` | AuthUser | Мои заявки (as=applicant/listing_owner) |
| PUT | `/{id}/status` | AuthUser | Accept/reject (owner only) |

### Outcome Reviews (`/outcome-reviews`)
| Method | Path | Auth | Описание |
|--------|------|------|----------|
| POST | `/` | AuthUser | Создать review |
| GET | `/{id}` | AuthUser | Просмотр review |
| PUT | `/{id}/consent` | AuthUser | Developer consent/response |

## Database schema (7 миграций)

| Таблица | Ключевые поля | Constraints |
|---------|---------------|-------------|
| users | id, email, role, display_name, auth_provider | UNIQUE(email), CHECK(role) |
| refresh_tokens | user_id, token_hash, family_id, expires_at | FK → users CASCADE |
| magic_link_tokens | email, token_hash, role, used, expires_at | |
| developer_profiles | user_id, bio, tech_stack, github_url, level | FK → users CASCADE |
| company_profiles | user_id, company_name, description, website, size | FK → users CASCADE |
| listings | author_id, type, title, tech_stack, price_usd, format, visibility, status, experience_level | FK → users, CHECK(type, format, visibility, status) |
| applications | listing_id, applicant_id, message, status | FK CASCADE, UNIQUE(listing_id, applicant_id) |
| outcome_reviews | application_id, reviewer_id, criteria_results, overall_recommendation | FK CASCADE, UNIQUE(application_id) |

**Индексы:** refresh_tokens(user, family), applications(listing, applicant), listings(author, type+status, created_at), magic_link_tokens(email), outcome_reviews(reviewer)
