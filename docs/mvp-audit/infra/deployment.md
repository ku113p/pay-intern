# Infrastructure: Deployment и Database

[← Назад](../README.md)

## Nginx

**Файл:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Есть:** API proxy, forwarding headers, SPA fallback

**Нет (добавить в Stage 1.5):**
- `server_tokens off;`
- gzip (text/css, application/javascript, application/json)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy
- Cache-Control для /assets/ (expires 1y, immutable)
- HTTPS (Stage 3.2)

## Environment Config

**Файл:** `backend/.env.example`

| Variable | Default | Описание |
|----------|---------|----------|
| DATABASE_URL | sqlite://data/devstage.db | Путь к SQLite |
| JWT_ACCESS_SECRET | placeholder | 32+ chars, random |
| JWT_REFRESH_SECRET | placeholder | 32+ chars, ОТЛИЧНЫЙ от access |
| JWT_ACCESS_EXPIRY_SECS | 900 | 15 минут |
| JWT_REFRESH_EXPIRY_SECS | 604800 | 7 дней |
| GOOGLE_CLIENT_ID | empty | Опционально |
| GOOGLE_CLIENT_SECRET | empty | Опционально |
| GOOGLE_REDIRECT_URI | http://localhost:3000/auth/google/callback | |
| SMTP_HOST | localhost | Dev: mailhog |
| SMTP_PORT | 1025 | Dev: mailhog |
| SMTP_FROM | noreply@devstage.local | |
| MAGIC_LINK_BASE_URL | http://localhost:5173/auth/verify | Frontend URL |
| SERVER_PORT | 3000 | |

**Не в .env.example:** SMTP_USER, SMTP_PASS, SMTP_TLS_INSECURE

**Нужно добавить:** CORS_ORIGIN (Stage 1.4)

## Database: SQLite

### Конфигурация
- **WAL mode** — concurrent reads during writes
- **Foreign keys enabled**
- **Dual-pool:** read (5 connections) / write (1 connection)
- **Busy timeout:** 5 секунд
- **Auto-migrate:** `sqlx::migrate!()` при старте
- **Persistence:** Docker named volume `backend-data:/app/data`

### Подходит для MVP?
- **Да** для < 1000 concurrent users
- Single-writer design = bottleneck при масштабировании
- Нет multi-instance deployment (один backend container)

### Масштабирование (когда потребуется)
| Users | Действие |
|-------|---------|
| < 100 | Текущая архитектура OK |
| 100-1000 | Backups, monitoring, HTTPS |
| 1000+ | Миграция на PostgreSQL |
| 10000+ | CDN, кэширование, multi-instance |

### Backups (отсутствуют!)
Docker named volume без backup strategy. Потеря volume = потеря всех данных.

**Рекомендация (Stage 3.3):**
```bash
# scripts/backup.sh
sqlite3 /app/data/devstage.db ".backup /backups/devstage-$(date +%Y%m%d).db"
find /backups -name "devstage-*.db" -mtime +7 -delete
```

## Production Deployment Checklist

```
[ ] Сгенерировать JWT_ACCESS_SECRET (32+ chars, random)
[ ] Сгенерировать JWT_REFRESH_SECRET (32+ chars, random, ОТЛИЧНЫЙ)
[ ] Настроить домен и DNS
[ ] TLS сертификат (Let's Encrypt / Caddy auto)
[ ] SMTP сервер (SendGrid / Postmark / AWS SES)
[ ] Google OAuth credentials (опционально)
[ ] CORS_ORIGIN = https://yourdomain.com
[ ] Backup strategy для SQLite
[ ] Мониторинг / logging
[ ] docker compose pull && up -d
[ ] curl https://domain/health → {"status": "ok"}
[ ] Magic link flow (email delivery test)
[ ] Security headers (curl -I)
```

## Документация проекта

| Файл | Содержание |
|------|------------|
| README.md | Tech stack, local dev, Docker, API overview |
| CLAUDE.md | Architecture, conventions, auth deep-dive |
| docs/ARCHITECTURE.md | System diagrams, dual-pool, token rotation |
| docs/landing-page-specs.md | 48KB SEO/marketing research |
| docs/mvp-audit/ | Этот аудит |

**Отсутствует:**
- Deployment guide (production)
- Runbook (operations)
- API docs (OpenAPI/Swagger)
