# CTA Strategy

## Core Principle

**Single conversion goal**: Get the visitor to either browse listings (`/developers`)
or create an account (`/register`). Every CTA on the page leads to one of these.

## CTA Inventory (8+ buttons)

| Section | CTA Text | Target | Style | Audience |
|---------|----------|--------|-------|----------|
| 1 Hero | "I'm a Developer" | `/developers` | Green solid | Developers |
| 1 Hero | "I'm a Company" | `/register` | Blue solid | Companies |
| 2 Pain: Companies | "Try a Different Approach" | `/register` | Blue outline | Companies |
| 3 Pain: Developers | "Break the Loop" | `/register` | Green outline | Developers |
| 4 Solution | "Browse Listings" | `/developers` | Indigo solid | Both |
| 5 How It Works: Co | "Post a Listing" | `/register` | Blue solid | Companies |
| 6 How It Works: Dev | "Find a Project" | `/developers` | Green solid | Developers |
| 7 Outcome Criteria | "See How It Works" | `/developers` | Indigo outline | Both |
| 8 Challenge Seekers | "Take the Challenge" | `/developers` | Indigo solid | Developers |
| 10 Comparison | "Get Started" | `/register` | Indigo solid | Both |
| 12 Final CTA | "Get Started" | `/register` | Blue solid | Companies |
| 12 Final CTA | "Browse Listings" | `/developers` | Green solid | Developers |

**Total: 12 CTA buttons** across 12 sections.

## Link Targets (Public Routes Only)

All CTAs link to pages accessible without authentication:

| Route | Purpose | Used In |
|-------|---------|---------|
| `/developers` | Browse company listings (public) | 5 CTAs |
| `/register` | Create account | 5 CTAs |
| `/` | Home page | Logo link, footer |
| `/login` | Sign in | Secondary link in hero/footer |

## Button Design System

### Solid Buttons (Primary Actions)
```
Green solid:  bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3
Blue solid:   bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3
Indigo solid: bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3
```

### Outline Buttons (Secondary Actions)
```
Green outline:  border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg px-6 py-3
Blue outline:   border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg px-6 py-3
Indigo outline: border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg px-6 py-3
```

## Sticky Mobile CTA

On mobile (< 768px), a fixed bottom bar appears after scrolling past the hero:

```
+--------------------------------------------------+
| [Browse Listings]  |  [Get Started]               |
+--------------------------------------------------+
```

- Left button: green -> `/developers`
- Right button: indigo -> `/register`
- Background: white with top shadow
- Appears after hero section scrolls out of view

## Placement Rules

Based on landing page best practices research:

1. **Above the fold** -- CTAs here outperform below-fold by 304%
2. **After each pain/solution pair** -- when motivation is highest
3. **End of page** -- final push after consuming full narrative
4. **Repeat same action** -- all CTAs drive to `/developers` or `/register`
5. **Personalized CTAs convert 202% better** -- color-coding by audience achieves this

## Related

- [Page Structure](page-structure.md) -- where CTAs appear
- [Design Principles](design-principles.md) -- visual specs
- [Messaging Framework](messaging-framework.md) -- CTA copy options
