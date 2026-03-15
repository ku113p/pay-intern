# Frontend: Страницы и компоненты

[← Назад](../README.md)

## Страницы (11)

| Роут | Страница | Auth | Статус |
|------|----------|------|--------|
| `/` | HomePage | - | OK, dashboard для залогиненных |
| `/login` | LoginPage | - | BUG: хардкодит role='developer' |
| `/register` | RegisterPage | - | OK, выбор роли |
| `/auth/verify` | MagicLinkVerifyPage | - | OK |
| `/developers` | DeveloperFeedPage | - | OK, публичный фид |
| `/companies` | CompanyFeedPage | Protected | OK |
| `/listings/:id` | ListingDetailPage | - | OK, с формой заявки |
| `/listings/new` | CreateListingPage | Protected | OK |
| `/applications` | MyApplicationsPage | Protected | UUID вместо имён |
| `/profile` | ProfilePage | Protected | OK |
| `/profiles/:type/:id` | PublicProfilePage | - | OK |

### Отсутствующие страницы
- **MyListingsPage** (`/listings/mine`) — управление листингами (edit/close). Backend и API клиент готовы.
- **ReviewPage** (`/reviews/:id`) — создание/просмотр review. Компоненты ReviewForm/ReviewDisplay готовы.
- **Search** — нет поля поиска в фидах (только фильтры)

### ProtectedRoute
`components/auth/ProtectedRoute.tsx` — wrapper, редирект на `/login` если !isAuthenticated.

## Компоненты (15)

### auth/ (3)
| Компонент | Назначение | Проблемы |
|-----------|------------|----------|
| LoginForm | Magic link логин | BUG: `requestMagicLink(email, 'developer')` line 13 |
| RegisterForm | Регистрация с выбором роли | OK |
| ProtectedRoute | Auth guard wrapper | OK |

### layout/ (2)
| Компонент | Назначение | Проблемы |
|-----------|------------|----------|
| Layout | Main layout wrapper | OK |
| Header | Navigation + mobile hamburger | Нет ссылки "My Listings" |

### listings/ (4)
| Компонент | Назначение | Проблемы |
|-----------|------------|----------|
| ListingCard | Карточка в фиде | OK |
| ListingDetail | Полный просмотр + форма заявки | OK |
| ListingForm | Создание листинга | Нет edit mode |
| FeedFilters | Sidebar фильтры | Нет поля поиска |

### profiles/ (3)
| Компонент | Назначение | Проблемы |
|-----------|------------|----------|
| DeveloperProfileForm | Редактирование dev профиля | OK |
| CompanyProfileForm | Редактирование company профиля | OK |
| PublicProfile | Публичный просмотр профиля | OK |

### applications/ (1)
| Компонент | Назначение | Проблемы |
|-----------|------------|----------|
| ApplicationList | Мои заявки + полученные | UUID display, нет withdraw |

`StatusBadge` — внутренний helper компонент (pending/accepted/rejected badges).

### reviews/ (2)
| Компонент | Назначение | Проблемы |
|-----------|------------|----------|
| ReviewForm | Создание review | Готов, нет страницы/роута |
| ReviewDisplay | Просмотр review | Готов, нет страницы/роута |

## Чего не хватает из компонентов

- **ErrorBoundary** — crash = белый экран
- **Toast/Notification** — feedback пропадает при навигации
- **Skeleton/Loading** — только текст "Loading..."
- **Reusable UI** (Button, Input, Modal) — всё inline с Tailwind
