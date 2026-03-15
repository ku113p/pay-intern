# Design Principles

## Core Approach

The promo page has its **own unique design** -- it does NOT use the shared Layout
component with Header/nav from the main app. This is a standalone, full-screen,
marketing-focused page.

## Technical Stack

- **React** with TypeScript
- **Tailwind CSS v4** (already in the project)
- **React Router** `Link` component for navigation
- **Single component**: `PromoPage.tsx` (no sub-components needed)
- **No additional dependencies**

## Layout

### Container
- Full-width sections with alternating backgrounds
- Content within `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Each section has generous vertical padding: `py-16 sm:py-20 lg:py-24`

### Responsive Breakpoints
- Mobile-first design
- `sm:` (640px) -- slight adjustments
- `md:` (768px) -- two-column layouts
- `lg:` (1024px) -- full desktop layout

### Grid System
- Stats: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`
- Cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Two-path CTA: `grid grid-cols-1 md:grid-cols-2 gap-8`
- Comparison table: horizontal scroll on mobile, full table on desktop

## Typography

### Hierarchy
```
Hero headline:    text-4xl sm:text-5xl lg:text-6xl font-bold
Section headline: text-3xl sm:text-4xl font-bold
Subheadline:      text-xl sm:text-2xl font-medium text-gray-600
Body text:        text-lg text-gray-600
Stat number:      text-5xl sm:text-6xl font-bold
Stat label:       text-sm text-gray-500 uppercase tracking-wide
```

### Font
- System font stack (already configured in Tailwind)
- No custom fonts needed

## Color System

### Background Alternation Pattern
```
Section 1 (Hero):     bg-gradient-to-br from-indigo-900 to-indigo-700
Section 2 (Pain Co):  bg-white
Section 3 (Pain Dev): bg-gray-50
Section 4 (Solution): bg-indigo-50
Section 5 (HiW Co):   bg-white
Section 6 (HiW Dev):  bg-gray-50
Section 7 (Outcomes):  bg-white
Section 8 (Challenge): bg-indigo-50
Section 9 (Numbers):   bg-indigo-900 (dark)
Section 10 (Compare):  bg-white
Section 11 (FAQ):      bg-gray-50
Section 12 (Final):    bg-gradient-to-br from-indigo-700 to-indigo-900
```

### Audience Color Coding
- **Developer-facing**: green accents (green-600, green-100)
- **Company-facing**: blue accents (blue-600, blue-100)
- **Neutral/both**: indigo accents (indigo-600, indigo-100)

### Status Colors (Outcome Review Mockup)
- PASS: `bg-green-100 text-green-800`
- PARTIAL: `bg-yellow-100 text-yellow-800`
- FAIL: `bg-red-100 text-red-800`

## Interactive Elements

### Stat Cards
```
bg-white rounded-xl shadow-lg p-6 sm:p-8
hover:shadow-xl transition-shadow
```

### FAQ Accordion
- Click to expand/collapse
- `cursor-pointer` on question
- Smooth height transition
- Chevron icon rotates on open

### Sticky Mobile CTA
- `fixed bottom-0 left-0 right-0 z-50`
- `md:hidden` (only on mobile)
- `bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`
- Appears after scrolling past hero (use IntersectionObserver or scroll state)

## Minimal Header

Top of page, not the app's header:
```
<nav className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
  <Link to="/" className="text-white font-bold text-xl">DevStage</Link>
</nav>
```

## Responsive Behavior

### Mobile (<768px)
- All grids stack to single column
- Hero buttons stack vertically
- Comparison table scrolls horizontally
- Sticky bottom CTA bar visible
- Reduced padding (py-12 instead of py-24)

### Tablet (768-1024px)
- 2-column grids where appropriate
- Hero buttons side by side
- Comparison table visible without scroll

### Desktop (>1024px)
- Full 3-column grids
- Maximum content width applied
- All visual elements at full size

## Performance

- No images (text-only, icon-free for MVP)
- Single component, no lazy loading needed
- Minimal state (only FAQ accordion open/close)
- Target: <2.5s LCP (Largest Contentful Paint)

## Related

- [Page Structure](page-structure.md) -- what goes in each section
- [CTA Strategy](cta-strategy.md) -- button specifications
- [Messaging Framework](messaging-framework.md) -- text content
