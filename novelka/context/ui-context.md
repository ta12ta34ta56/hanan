# UI Context — Novelka

> Defines the visual language. The agent must NEVER invent a color, radius, or layout
> pattern — read this file. Every color is a token defined in `src/index.css`.

---

## Theme model

- **Light-first.** `data-theme` on `<html>`; default is light. A toggle switches to dark.
- Two token sets: the **editor** (`--surface*`, `--text*`, `--accent`, `--good/warn/bad`)
  and the **landing/home** (`--lp-*`). Both define light AND dark values.
- **The canvas page is always white paper** (`--paper`). It does NOT follow the theme —
  the job is previewing print. The editor shell (panels, rails, docks) does follow the
  theme.

---

## Color tokens (semantic — from `src/index.css`)

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--surface` | #f3f4f6 | #0f1115 | page behind everything |
| `--surface-2` | #ffffff | #161a22 | panels, top bar |
| `--surface-3` | #f1f5f9 | #1d222c | cards, inputs |
| `--surface-4` | #e2e8f0 | #252b37 | hover/raised |
| `--text` | #16191f | #e7ebf2 | primary text |
| `--text-dim` | #475569 | #98a2b3 | secondary text |
| `--text-mute` | #64748b | #6b7484 | muted text |
| `--accent` | #4f46e5 | #6366f1 | primary accent (indigo) |
| `--accent-2` | #7c4ddb | #8b5cf6 | secondary accent |
| `--good` | #0f9d63 | #34d399 | success / valid |
| `--warn` | #a86a00 | #fbbf24 | warning |
| `--bad` | #d13b3b | #f87171 | error |
| `--line` | #e2e8f0 | #2b3240 | borders |

Landing (`--lp-*`): `--lp-bg`, `--lp-card`, `--lp-text`, `--lp-dim`, `--lp-accent`,
`--lp-teal`, `--lp-line` — used by the home screen and nav.

**Guide-line colors (fixed, print-preview semantics — NOT theme-dependent):**

| Guide | Color | Meaning |
|---|---|---|
| Bleed / trim boundary | `#EF4444` | outer bleed that gets trimmed |
| Spine folds | `#3B82F6` | spine edges |
| Safe area | `#22C55E` | safe live-area margin |
| Barcode box | `#F59E0B` | KDP barcode keep-out |

Guide overlay styling: 1.5px stroke, opacity 0.65, dash `4 4`, `pointer-events:none`,
`z-index:10`, DOM-only (never in the canvas). Snapped guide flashes to opacity 1.

---

## Typography

- Base: **Inter**, `font-size: 13px`, `-webkit-font-smoothing: antialiased`.
- Headings: inherit Inter with heavier weights and negative letter-spacing on large
  landing headings.
- **`font-synthesis: none`** is set globally — never fake bold/italic. Use the real
  font files (weight 400/700 × normal/italic).
- Canvas text uses the loaded asset fonts (The Seasons, Montserrat Alternates,
  Cormorant, Fredoka, etc.) — real faces only.

---

## Border radius scale

- `--radius: 16px` (dark) / `12px` (light) — major docks/panels/modals.
- `--radius-sm: 12px` / `10px` — buttons, cards, inputs.
- Small chips/pills/badges: `999px` (fully rounded).
- Page thumbnails, cover: small radius (`~5–7px`).

---

## Spacing & layout

- Base spacing unit ~4px (gaps of 4/8/12/16/24/32).
- **Editor layout grid:** `rail | tool/inspector panel | canvas workspace | right dock`.
  Left rail is icons-only; right dock is Pages/Layers/KDP.
- Bottom bar (`editor-footer`) is an icons-only quick-action bar, inset via
  `--strip-left/--strip-right` so it never overlaps panels.
- Modals: centered, `--bg-2` surface, max-height ~86vh, rounded, `z-index:10000`.
- Landing: `--lp-*` tokens, calm editorial sections, generous whitespace.

---

## Component conventions

- **Buttons:** `.btn` (base), `.btn.primary` (accent gradient), `.btn.ghost`, `.btn.sm`,
  `.btn.icon`. Icons-only buttons have tooltips + aria-labels.
- **Chips** (`.chip`) for toggle options; **segmented** (`.seg`) for mutually-exclusive
  modes; **swatches** for color.
- **Toggle rows** (`.toggle-row`) for booleans.
- **Panels** (`.panel`) width 312px, `panel-head` + `panel-body`.
- **Icon set** is the custom `Icon` component (`src/components/Icon.tsx`) — no new
  SVG icon should be added without checking the existing set first.

---

## Cover editing surface

- The cover is a **clean flat page** (back + spine + front + bleed). It shows the user's
  content and at most the phantom guideline overlay (bleed perimeter, spine folds,
  safe area, barcode box). No other chrome on the cover.
- Default cover background: light gray `#f3f4f6`.
- Selection feedback appears only while actively editing, then clears — same as interior.

---

## Micro-interactions

- Subtle hover lifts (`translateY(-1/2px)`) and border-color changes; short
  `120–160ms` transitions. Respect `prefers-reduced-motion`.
- Toast notifications via `toast-store` for status/errors.
