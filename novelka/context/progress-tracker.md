# Progress Tracker — Novelka

> Update this file after every meaningful implementation change.

---

## Current Phase

- **Phase 0 — Re-architecture.** We are rebuilding Novelka on the Six-File Context
  System so the agent builds predictably and without drift. No implementation has been
  rewritten yet; the existing code is the reference implementation.

## Current Goal

- Lock the product decisions (this file's Open Questions) and convert them into the
  build plan (`context/specs/00-build-plan.md`) and the first unit specs.

## Completed

- Created the `context/` Six-File Context System:
  - `project-overview.md`
  - `architecture.md`
  - `code-standards.md`
  - `ui-context.md`
  - `ai-workflow-rules.md`
  - `progress-tracker.md` (this file)
- Grounded the files in the actual current app (stack, modules, KDP math, generators).

## In Progress

- **Decision lock** — resolving the Open Questions below with the product owner.

## Next Up

- Produce `context/specs/00-build-plan.md` (unit breakdown in build order).
- Produce the first unit spec (likely: project skeleton + fixed-trim New Book flow).
- Begin implementation of unit 01 against the spec.

## Open Questions (to resolve with the owner — be critical, don't guess)

1. **Fresh code vs. refactor-in-place.** The existing codebase has real value (generators,
   KDP math, layers/pages). Do we (a) rebuild the code fresh against this context, or
   (b) keep the code and refactor it to converge on these standards? My recommendation:
   **(b)** — keep working code, refactor toward the spec. Starting the code from zero
   throws away months of working logic for no benefit.
2. **Scope of "no drag-and-drop."** Confirm the boundary: no free-form canvas assembly.
   But keep Layers/Pages **reorder** (drag-reorder in those panels is fine) and
   **select/move/resize individual elements**? My recommendation: yes — reorder pages/
   layers and move/resize elements is fine; we remove free-form multi-element canvas
   design as a headline feature.
3. **Trim list.** Use the fixed KDP trims (5×8 … 8.5×11, A4/A5) and drop custom sizes.
   Confirm which exact set is the supported list for v1 (suggest: the common 6×9,
   5.5×8.5, 7×10, 8.5×11 + A4/A5).
4. **Auth.** Guest-first (no login required to make/export a book), or require sign-in?
   Recommend guest-first for v1.
5. **What to drop that currently exists** (be honest): which current features are dead/
   broken and should be removed vs. kept? (e.g. payments/admin/marketplace — out of scope
   — and any dead panels/controls to prune).
6. **Cover UX depth.** The cover math is good. How much cover *editing* does v1 need?
   Recommend: flat cover with phantom guides + a couple of editable text/background
   fields, not a full designer.
7. **Mobile.** Confirm desktop-first (responsive but not mobile-primary).

## Architecture Decisions

- **Guide overlays are DOM-only**, never in page data / selection / thumbnails / export.
- **"Apply to all" reads the `kind` tag**; the cover is an isolated surface.
- **Generated pages build at interior trim size** (never cover size, never hardcoded).
- **Fixed KDP trims only; no custom sizes.**
- **No free-form drag-and-drop design** as a feature.
- **Real font files only** (no synthetic bold/italic).

## Session Notes

- The current dev app runs at `http://localhost:5173/`.
- `npm run test:unit` is the full suite; each generator/domain area has its own
  `test:*` script.
- The existing code is the reference implementation until we decide fresh vs. refactor.
