# PinPro design direction

PinPro is used outdoors, on a phone, between shots. The UI favours legibility and big targets over decoration.

## Palette

Kept deliberately close to the original look: the existing navy plus one golf green. Tokens live in `pinpro/frontend/src/styles.css` (`@theme`).

| Token | Value | Use |
|---|---|---|
| `navy` | `#202334` | Nav bar, hero, headings, hole header |
| `fairway` | `#166534` | The only accent: primary buttons, links, active nav, success, chart line (7:1 on white) |
| `fairway-dark` | `#14532d` | Hover on primary |
| `fairway-soft` | `#ecfdf3` | Tinted surfaces (suggestion result, icon chips) |
| `page` | `#f6f8f7` | App background; cards are white |
| Tailwind `slate-*` | — | Body text and borders |
| Tailwind `red-*` | — | Errors and destructive actions only |

No gradients and no secondary accent colours. "Elevated" comes from spacing, type hierarchy, rounded cards (`rounded-2xl`) and soft shadows.

## Type and layout

- System font stack with tabular numerals, so yardages and scores align.
- Scale: page titles 30–36px bold, section titles 18–20px semibold, body 16px (no inputs under 16px, which avoids iOS zoom).
- Content width `max-w-6xl`. Mobile-first; checked at 375 / 768 / 1024 / 1440.
- Phones get a bottom tab bar (Home, Play, Clubs, Profile) within thumb reach; desktop uses the top bar.

## Components (`src/components/ui.tsx`)

`Button` (primary / secondary / ghost / danger, with a loading state), `Input` (visible label, hint, inline error wired with `aria-describedby`), `Card`, `Alert` (role `alert` for errors, `status` otherwise), `EmptyState`, `Loading`, `PageHeader`. Icons are inline SVG (`icons.tsx`), never emoji.

## Interaction rules

- Every touch target is ≥44px; primary on-course actions are 48px.
- Each screen has one primary action.
- Feedback states are separate: loading, load failure (with Retry), empty (with next step), success, validation error next to the field.
- Destructive actions (clear clubs, abandon round) ask for confirmation.
- A 3px green focus ring on every interactive element; skip link; focus moves to the page on navigation.
- `prefers-reduced-motion` disables transitions and chart animation.
- Typing never changes layout above the field being edited (see the Setup onboarding banner).
