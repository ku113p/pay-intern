# DevStage MVP Audit

Дата: 2026-03-15 | Общая готовность: ~75%

DevStage — платформа matching junior-разработчиков и компаний через paid internships.

## Навигация

### [Roadmap — 3 стадии до идеального MVP](roadmap.md)
18 задач, ~40-50 часов. Stage 1 (launch blockers) → Stage 2 (core experience) → Stage 3 (growth).

### Backend Audit
- [Endpoints и архитектура](backend/endpoints.md) — 26 эндпоинтов, три слоя, shared state
- [Auth система](backend/auth.md) — JWT, magic link, Google OAuth, token rotation
- [Security и тестирование](backend/security.md) — CORS, rate limiting, покрытие тестами
- [Пробелы и рекомендации](backend/gaps.md) — что доделать

### Frontend Audit
- [Страницы и компоненты](frontend/pages.md) — 11 страниц, 15 компонентов
- [API интеграция и state](frontend/api-state.md) — axios, React Query, Zustand
- [UX и accessibility](frontend/ux.md) — responsive, a11y, формы
- [Пробелы и рекомендации](frontend/gaps.md) — что доделать

### Infrastructure Audit
- [Docker и CI/CD](infra/docker-cicd.md) — compose, Dockerfiles, GitHub Actions
- [Deployment и database](infra/deployment.md) — nginx, env config, SQLite, бэкапы

## Текущее состояние

| Область | Готовность | Главная проблема |
|---------|-----------|-----------------|
| Backend endpoints | 95% | Нет withdraw, account deletion |
| Auth | 80% | Login bug, нет email verification |
| Security | 70% | CORS Any, нет per-endpoint rate limit |
| Frontend pages | 75% | Нет edit listing, review page |
| Frontend UX | 70% | UUID в заявках, нет toast, нет search |
| Infrastructure | 70% | Нет HTTPS, backups, auto-deploy |
| Testing | 15% | 4 unit-теста, нет integration/E2E |
