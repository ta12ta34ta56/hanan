# 04 — Target architecture (launch)

This is the architecture the next agent shapes **toward**. It is a prune of
the current tree, not a greenfield rewrite.

Full invariants live in `novelka/context/architecture.md`. This file is the
launch-shaped version.

---

## Stack (unchanged)

| Layer | Tech | Rule |
|---|---|---|
| UI | React 19 | Function components |
| Build | Vite 8 | Bind 0.0.0.0 if you run a preview |
| Canvas | Fabric.js 6 | **Only** `src/engine/` imports Fabric |
| State | Zustand 5 | Shared state lives in stores |
| PDF | pdf-lib + fontkit | Interior + cover files |
| Storage | IndexedDB via `storage.ts` | Honest failures |
| Types | TypeScript | No `any` except `FabricAny` |

Do not add packages unless a unit cannot ship without them.

---

## Target folder roles

```
src/
├── types/            shared Page, GeneratorKind, PageRole, trims
├── services/         PURE domain: kdp, kdp-cover, book, storage, templates
├── domain/           word-search solver, preflight, quick-word-search
├── engine/           CanvasEngine, pdf-export, fonts, thumbnails
├── modules/          one folder per generator + shared/
├── stores/           canvas, editor-ui, theme, toast, generator
├── components/
│   ├── home/         Home, Create, Projects, Templates
│   ├── navigation/   CustomerNav
│   ├── modals/       wizard, preview, export, new-book, help
│   ├── editor/       light editor shell (pages, layers, inspector)
│   └── canvas/       CanvasStage, CoverGuides, PageStrip
├── hooks/
└── utils/            units, svg-sanitize, file-utils
```

**After prune, these customer surfaces should be gone or unreachable:**

- `src/admin/` and `admin-main.tsx` / `admin.html` (not in customer build)
- `components/modals/AdminPanel.tsx`, `OwnerGate.tsx`
- `components/UpgradePrompt.tsx`
- `services/payments.ts`, `feature-flags.ts` (customer use), `admin-access.ts`
- Elements / stickers / shape toolbox as a headline rail
- Custom size inputs

Server (`novelka/server/`) is **frozen**. Do not extend it. Do not delete it
in the first unit (too much test fallout). Just stop calling it from the
customer golden path.

---

## Data model (keep)

```
Project = { pages: Page[], book: BookSettings, name, version }
Page    = { id, name, width, height, background, data, role, kind }
Book    = { trimWidth, trimHeight, paper, binding }
```

- `page.data` = Fabric JSON. Guide overlays are **not** in it.
- Cover geometry is **derived** (`calculateCover`) from book + interior count.
- `kind` is stamped at generation and is the only apply-to-all key.

---

## Golden-path modules (own the launch)

| Concern | Owner |
|---|---|
| Wizard config → book | `domain/quick-word-search.ts` + `QuickWordSearchWizard.tsx` |
| Puzzle generation | `modules/word-search/generator.ts` (+ worker) |
| Page build / layout | `modules/word-search/build-pages.ts`, `layout.ts`, `renderer.ts` |
| Preflight | `domain/preflight.ts` + `services/kdp.ts` |
| Cover math | `services/kdp-cover.ts`, `cover-guides.ts` |
| Export | `engine/pdf-export.ts` |
| Persist | `services/storage.ts` |
| Preview | `components/modals/PreviewMode.tsx` |

---

## Invariants (never violate)

Copied here so you cannot miss them:

1. Guide overlays are never document content.
2. The cover is an isolated surface.
3. "Apply to all" reads the `kind` tag only.
4. Generated pages are built at the interior trim.
5. Only the locked trim list is offered.
6. No free-form design as a feature.
7. UI adapts to engines, never the reverse.
8. Fonts are real files.
9. No dead controls.
10. No payments / admin / marketplace in the customer app.
11. Both serialization allow-lists stay in sync (D-22).

---

## State rules

- Stores hold app state. Local `useState` is for ephemeral UI only.
- `App.tsx` is already a god object (778 lines). Prefer extracting view
  routers over adding more modal kinds. Do not rewrite it "for cleanliness"
  outside a unit that needs a slice of it.
- Do not keep a second source of truth for entitlement. Launch has **no
  entitlement**.

---

## Test map (what to run)

| Change area | Command |
|---|---|
| Word search | `npm run test:wordsearch` and `npm run test:quick-flow` |
| Preflight / KDP | `npm run test:preflight` `npm run test:kdp` `npm run test:cover-guides` |
| Engine | `npm run test:engine` |
| Storage / projects | `npm run test:project-flow` |
| Nav / home | `npm run test:nav-flow` |
| Preview | `npm run test:preview-flow` |
| Typecheck + lint + build | `npm run lint` · `tsc -b` · `npm run build` |

Do **not** treat `npm run check` as a launch gate if it fails only because
you correctly removed admin/payments tests. See D-23.

The 2GB sandbox OOMs if leftover Vite/Chrome processes pile up.
Before heavy browser tests: see BUG-010.
