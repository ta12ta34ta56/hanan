# Architecture — Novelka

> Defines the stack, system boundaries, storage model, and **invariants** the codebase
> must never violate. This is the most important file in the context system. Read it
> before touching any code.

---

## Stack

| Layer | Technology | Role |
|---|---|---|
| UI framework | React 19 | Declarative component tree |
| Build / dev | Vite 8 | Dev server, bundling, HMR |
| Canvas | Fabric.js 6 | Rendering pages and covers (the editor surface) |
| State | Zustand 5 | Client state stores |
| Types | TypeScript | All code is typed |
| PDF export | pdf-lib | Generate KDP PDFs (interior + cover) |
| PDF import | pdfjs-dist | Optional page import |
| Fonts | font-manager / local-fonts | Real bold/italic asset files (never synthetic) |
| Storage | local (storage.ts) | Persist projects; optional Supabase for future auth |

---

## System boundaries — which folder owns what

```
src/
├── types/          # Shared types: Page, GeneratorKind, PageRole, units (IN), presets
├── services/       # Pure domain logic, NO React:
│   ├── kdp.ts          # KDP margins, safe-area, trim sizes, preflight (math)
│   ├── kdp-cover.ts    # Cover/spine math (calculateCover, coverZones) — DO NOT rewrite
│   ├── book.ts         # Book model: trim presets, coverSpecFor, buildCoverObjects
│   ├── cover-guides.ts # Phantom cover guide geometry (reads kdp-cover)
│   ├── templates.ts    # Generic interior/planner/school/puzzle templates (build + preview)
│   ├── storage.ts      # Project persistence (local)
│   ├── project-sanitize.ts, book-resize.ts, selection-actions.ts, ...
├── engine/         # Fabric wrapper (CanvasEngine): mount, add, select, group, guides,
│                   #   PDF export/import, thumbnails. UI never imports Fabric directly.
├── stores/         # Zustand stores: canvas-store (pages/book/history), editor-ui-store
│                   #   (panels/zoom/guides toggles), theme-store, toast-store, ...
├── domain/         # Generator-independent logic: preflight, template rules,
│                   #   semantic-editing (word-search instance editing), text-combos
├── modules/        # One folder per generator. Each has its OWN build-pages / layout /
│   │               #   renderer / generator / templates / worker / Panel component.
│   ├── sudoku-maker/
│   ├── word-search/
│   ├── crossword/
│   ├── maze/
│   ├── handwriting/
│   └── shared/     # page-kind, puzzle-groups, live-style, placement, apply-to-all
├── components/     # React UI: canvas stage, editor dock, home screens, modals, panels
├── hooks/          # useSelection, usePreflight, useGrabReorder, useShortcuts, ...
└── utils/          # units, file utils, svg sanitize, ...
```

### Ownership rules
- **`services/` and `domain/` are pure** — no `useState`, no `useEffect`, no React.
  They take data in and return data out. Testable in isolation (many have `.test.mjs`).
- **`engine/` is the only place Fabric is imported** (except typing). All canvas
  mutations go through `CanvasEngine`. Components never call Fabric directly.
- **`modules/*` are self-contained.** Each generator owns its panel, build, layout,
  renderer, templates, and worker. Cross-generator logic lives in `modules/shared/`.
- **Stores are the only state.** Components read from Zustand stores; they don't keep
  important app state in local `useState` that other parts need.

---

## Storage model

- **Project** = `{ pages: Page[], book: BookSettings }`. A `Page` is `{ id, name,
  width, height, background, data (fabric JSON), role, kind }`.
- Persistence is **local** (`storage.ts`), keyed by project id. A project's `page.data`
  holds the serialized Fabric objects for that page. **Guide overlays are DOM-only and
  are NEVER written into `page.data`** — so thumbnails and export never show them.
- `book` stores `trimWidth/trimHeight` (pt), `paper`, `binding`. The cover geometry is
  **derived** from these + interior page count via `calculateCover`.

---

## Auth & access model

- Customer-facing product is **guest-first**; auth is optional and future. Where Supabase
  auth exists it is additive. Access rules (ownership) apply only to authenticated
  resources; the core create/edit/export flow must work with no account.

---

## Key domain concepts (invariants rest on these)

- **GeneratorKind** — every generated page is stamped with `kind`
  (`'sudoku' | 'wordsearch' | 'crossword' | 'maze' | 'handwriting' | 'template'`) at
  creation and persisted. **"Apply to all" and page classification read the tag; they
  never guess by object count or shape.**
- **PageRole** — `'cover'` vs `'interior'`. The cover is an isolated surface:
  interior "apply to all" and interior export never touch it.
- **KDP safe area** — `kdpMarginsFor(pageCount)` + `safeAreaFor(...)` produce the
  protected rectangle per page (gutter side flips for recto/verso). Generators and
  templates lay out inside it; preflight checks against it.
- **Trim sizes are fixed** — only the KDP trim list. No custom sizes.

---

## Invariants — rules the codebase must NEVER violate

1. **Guide overlays are never document content.** Cover/bleed/spine/safe/barcode guides
   are DOM overlays (pointer-events:none, z-index above canvas) and are NEVER written
   into `page.data`, never in selection, never in thumbnails, never in export.
2. **The cover is an isolated surface.** Interior "apply to all", interior templates,
   and interior export never modify or include the cover. Cover math stays in
   `kdp-cover.ts` (`calculateCover`, `coverZones`) and is never rewritten.
3. **"Apply to all" respects the `kind` tag.** It only touches pages of the same
   generator kind, and is one undo record.
4. **Generated pages are built at the interior trim size**, never the cover size, and
   never at a hardcoded/default size. Use the book's current trim.
5. **Only fixed KDP trims.** No custom size input. Templates must adapt to every
   supported trim.
6. **No drag-and-drop free-form canvas assembly as a feature.** Selection/editing stays
   simple and predictable.
7. **UI adapts to engines, never the reverse.** Don't restructure generator/engine code
   to satisfy a panel; adapt the panel to the engine's output.
8. **Fonts are real.** Bold/italic use the actual asset font files; never synthetic
   bold/italic.
9. **No dead controls.** Every visible control must do something real. No non-functional
   sliders, chips, or toggles.
10. **No payments/admin/marketplace in the customer app.** These are out of scope.
