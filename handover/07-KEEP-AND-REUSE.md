# 07 — Keep and reuse (do not rewrite)

The owner already paid two months for this. The new product is a new **door**,
not a new **engine**.

If you feel the urge to rewrite one of these, you are off-mission.

---

## Sacred — do not rewrite the math

| File | Why |
|---|---|
| `novelka/src/services/kdp-cover.ts` | Spine / wraparound math verified against KDP. Explicitly forbidden in workflow rules. |
| `novelka/src/services/kdp.ts` | Gutters, safe area, trim table, page-count limits. Reuse. |
| `novelka/src/services/cover-guides.ts` | Phantom guide geometry derived from kdp-cover. |

## Sacred — do not rewrite generator algorithms

| File | Why |
|---|---|
| `modules/word-search/generator.ts` | Placement, auto-grow, secret message. 30 tests. |
| `modules/word-search/word-banks.ts` | Curated lists. |
| `modules/sudoku-maker/generator.ts` | Unique-solution proof, 16×16 budget. |
| `modules/crossword/generator.ts` | Freeform interlocking, 42 tests. |
| `modules/crossword/clue-banks.ts` | 260 clues. |
| `modules/maze/generator.ts` | Graph carve + solver + measured difficulty. |
| `modules/handwriting/generator.ts` | Page data from letterforms. |
| `modules/handwriting/letterforms.ts` | Stroke-order letters. Hard-won bugfixes. |
| `modules/handwriting/word-banks.ts` | Phoneme-honest example words. |

You **may** call these. You **may** fix a proven bug with a failing test.
You may **not** replace the algorithm because you prefer another approach.

## Reuse as-is (adapt the UI around them)

| File | Role |
|---|---|
| `domain/quick-word-search.ts` | Wizard → book. Launch spine. |
| `domain/word-search-solver.ts` | Responsive layout solver. |
| `domain/preflight.ts` | Book checks. |
| `domain/template-registry.ts` | Parametric templates. Filter to published. |
| `modules/word-search/build-pages.ts` | Page flow + answers. |
| `modules/word-search/layout.ts` | Deterministic template-aware slots. |
| `modules/word-search/renderer.ts` | Puzzle → fabric objects. |
| `modules/shared/puzzle-utils.ts` | `PUZZLE_EXTRA_PROPS`, chunk/shuffle. |
| `modules/shared/page-kind.ts` | kind tags. |
| `engine/pdf-export.ts` | Interior / cover PDFs. |
| `engine/canvas-engine.ts` | Only Fabric owner. Extend EXTRA_PROPS, don't replace. |
| `engine/font-manager.ts` / `local-fonts.ts` | Real fonts. |
| `services/storage.ts` | IndexedDB + autosave + StorageFullError. |
| `services/book.ts` | Book model (strip custom-size UI, keep model). |
| `components/modals/QuickWordSearchWizard.tsx` | Launch UX. Refine, don't replace. |
| `components/modals/PreviewMode.tsx` | Spread preview. |
| `components/modals/ExportModal.tsx` | Export. Simplify choices. |
| `components/navigation/CustomerNav.tsx` | Top IA. |
| `components/HomeScreen.tsx` + `home/*` | New IA. Calm it down. |
| `components/canvas/CoverGuides.tsx` | DOM overlays. |
| `stores/canvas-store.ts` | Pages / book / history. |
| `stores/theme-store.ts` / `toast-store.ts` | Keep. Default theme = light (D-18). |

## Patterns you must keep

1. **Deterministic layout.** `(page, spec) → slots`. Never measure-then-nudge.
2. **Workers** for batch generation. Do not block the UI thread.
3. **kind tags** on pages and role tags on objects.
4. **Both allow-lists** when adding a persisted custom prop (D-22).
5. **Cover isolated** from interior operations.
6. **Suggest functions** only offer counts that fit the trim.
7. **CSS tokens**, not raw hex in components.
8. **Legacy storage key fallbacks** (`gridpress.*`, `minipdf.*`).

## When a keep-file is messy

Note it in the tracker. Do not clean it unless the current unit cannot ship
without touching that exact slice. Then touch the smallest slice.
