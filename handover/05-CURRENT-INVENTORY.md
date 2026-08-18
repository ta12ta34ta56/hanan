# 05 — Current inventory (as of 2026-08-18)

Measured from the tree. No code was changed while writing this.

## Size

| Metric | Value |
|---|---|
| `src/` TS/TSX files | 164 |
| `src/` lines | ~51,813 |
| Largest file | `engine/canvas-engine.ts` 1,446 |
| Next | `services/templates.ts` 1,239 |
| Next | `QuickWordSearchWizard.tsx` 1,027 |
| Next | `InspectorPanel.tsx` 967 |
| Next | `word-search/build-pages.ts` 955 |
| `App.tsx` | 778 |
| Test scripts in `package.json` | 30+ named suites |
| Claimed passing checks (`STATUS.md`) | 649+ |

## What already exists and works (do not rebuild)

### Generators (complete, tested)

| Module | Tests | Notes |
|---|---|---|
| Word search | 30 + build-pages + quick-flow | Launch path. 14–16 word banks. Worker. |
| Sudoku | generator + live | Unique-solution proven. 16×16 worker. |
| Crossword | 42 | Freeform, not American dense. 260 clues. |
| Maze | 52 + browser | 4 shapes, measured difficulty. |
| Handwriting | 94 + browser | Stroke data, 14 designs. |

Each module: `generator.ts` → worker → renderer → templates → layout →
`build-pages.ts` → `*Panel.tsx`.

### KDP / book

- `services/kdp.ts` — gutters, safe area, trim table, preflight math
- `services/kdp-cover.ts` — spine / wraparound (DO NOT REWRITE)
- `services/cover-guides.ts` — phantom guide geometry
- `services/book.ts` — trim presets, cover objects, **also custom trim limits**
- `domain/preflight.ts` — book-level checks
- `domain/quick-word-search.ts` — wizard → book pipeline

### Editor / engine

- Fabric wrapper, undo/redo 200 steps, layers, pages, thumbnails
- PDF export (hybrid text + raster), PNG/JPG
- Preview (single / spread / grid)
- IndexedDB storage + autosave + StorageFullError
- Light/dark tokens, ErrorBoundary "Download my work"

### New-product surfaces already started

- `CustomerNav` — Home / Create / Projects / Templates
- `HomeScreen`, `CreateView`, `ProjectsView`, `TemplatesView`
- `QuickWordSearchWizard` — 6-step wizard (the launch spine)
- Parametric template registry (`domain/template-registry.ts`)

## What exists and is the wrong product

| Surface | Path | Why it is wrong for launch |
|---|---|---|
| Canva rail | `App.tsx` RAIL: templates, generators, text, elements, uploads | Design-tool IA |
| Elements / stickers | `ElementsPanel`, `asset-library`, `public/assets/*` | Clip-art bloat |
| Shapes | `ShapePanel` | Free-form design |
| PDF import | `pdf-import.ts`, `ImportPdfModal` | Not a book producer |
| Feature flags | `feature-flags.ts`, `flag-store`, `content-registry` | Client "security" + paywall UX |
| Payments | `payments.ts`, `UpgradePrompt` | Out of scope |
| Auth gate | `auth.ts`, `AuthModal`, `requireEditorAuth` | Blocks guests when Supabase is set |
| Hidden admin | `admin-access.ts`, `AdminPanel`, `OwnerGate` | Security theatre in the customer app |
| Admin SPA | `src/admin/*`, `admin.html`, `admin-main.tsx` | Separate product |
| Ratings | `ratings.ts`, `RatingModal` | Not needed to launch |
| Server | `novelka/server/**` | Not a launch blocker |
| Custom size | `CUSTOM_TRIM_LIMITS`, New Book custom card | Violates D-09 |
| Duplicate docs | `/docs` and `novelka/docs` | Drift |

## Known traps in the current code

1. **Two EXTRA_PROPS allow-lists** (BUG-001).
2. **`App.tsx` `requireEditorAuth`** forces login when Supabase env is set (BUG-011).
3. **STATUS.md vs ui-context** disagree on default theme (ISS-006).
4. **README.md** still says projects live in localStorage in one section and
   IndexedDB in another (ISS-007).
5. **Template chrome not re-laid** on resize (BUG-002) — accepted for launch
   if grids stay inside the slot.
6. **Sandbox OOM** if Vite/Chrome leftover processes accumulate (BUG-010).
7. **React.StrictMode is off** because Fabric double-mounts (BUG-008).
8. **PDF custom fonts** often rasterize; Helvetica text layer only (BUG-007).
9. God files: `App.tsx`, `canvas-engine.ts`, `InspectorPanel.tsx`,
   `templates.ts`. Do not "clean" them unless the current unit requires a slice.

## Rename history (persistence)

MiniPDF Studio → Gridpress → Novelka.

Legacy keys still read: `gridpress.*`, `minipdf.*`, `gridpress:` page tags.
Do not break that fallback if you touch storage.

## Environment

- Dev: `cd novelka && npm install && npm run dev` → http://localhost:5173
- Supabase project id appears in STATUS.md (`mfadnnmkxkzsplerizvk`).
  A service-role key was exposed on 2026-07-28 and must be rotated **by the
  owner**, not by the coding agent. Not a coding unit.
- Stripe account was never created.
