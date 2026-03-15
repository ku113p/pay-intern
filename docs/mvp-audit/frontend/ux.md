# Frontend: UX и Accessibility

[← Назад](../README.md)

## Responsive Design

### Реализовано хорошо
- `flex-col md:flex-row` для адаптивных layout-ов
- Mobile hamburger menu: `md:hidden` toggle, backdrop overlay, auto-close при навигации
- FeedFilters sidebar: `hidden md:block` (скрыт на mobile)
- Grid breakpoints: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`
- Responsive text: `text-2xl sm:text-3xl md:text-4xl` на HomePage
- Cards: `flex-col sm:flex-row` для item layout
- Tailwind v4, breakpoints: sm (640px), md (768px), lg (implied)

### Header mobile menu
- Hamburger icon с `aria-label="Toggle menu"` и `aria-expanded`
- Overlay backdrop при open
- Auto-close при route change

## UX Completeness

| Аспект | Статус | Детали |
|--------|--------|--------|
| Loading | Базовый | Текст "Loading...", нет скелетонов |
| Errors | OK | Красные div-ы, ошибки API отображаются |
| Empty states | Хорошо | "No listings found", CTA для создания |
| Success | Базовый | Green div-ы inline, пропадают при навигации |
| Pagination | OK | Prev/next с номером, в URL params |
| Submit disabled | OK | Кнопки disabled, текст → "Saving..." |
| Undo | Нет | Нет undo для действий |

## Формы и валидация

### Текущий подход: HTML5 only
- `required` на обязательных полях
- `type="email"` для email
- `minLength={3}` на title, `minLength={10}` на description
- `min` и `step` на числовых input-ах

### Проблемы
- Нет field-level error messages (только global error div)
- Нет regex для URL полей (GitHub, LinkedIn, website)
- Нет проверки outcome_criteria >= 3 на клиенте (только backend)
- Нет real-time feedback при вводе
- Нет библиотеки валидации (достаточно для MVP при наличии backend validation)

## Accessibility

### Есть
- `aria-label` на hamburger menu
- `aria-expanded` для toggle state
- `htmlFor` на form labels
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<form>`, `<button>`
- Focus styles: `focus:border-indigo-500 focus:ring-indigo-500`

### Нет
- ARIA live regions для динамического контента
- Skip-to-main-content ссылка
- Focus trap в мобильном меню
- `aria-describedby` для form error messages
- Status badges опираются только на цвет (нет иконок)
- Screen reader announcements для loading/error

## Dependencies

| Package | Version | Назначение |
|---------|---------|------------|
| react | ^19.2.4 | UI |
| react-dom | ^19.2.4 | DOM |
| react-router-dom | ^7.13.1 | Routing |
| @tanstack/react-query | ^5.90.21 | Data fetching |
| zustand | ^5.0.11 | State |
| axios | ^1.13.6 | HTTP |
| timeago.js | ^4.0.2 | Relative time |
| tailwindcss | ^4.2.1 | CSS |
| typescript | ~5.9.3 | Types |
| vite | ^7.3.1 | Build |
| eslint | ^9.39.4 | Lint |

### Отсутствующие (рекомендуемые для Stage 2)
- `react-hot-toast` — toast notifications
- `react-error-boundary` или custom ErrorBoundary
- Testing: vitest, @testing-library/react (Stage 3)
