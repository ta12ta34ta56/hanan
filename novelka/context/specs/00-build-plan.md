# Build Plan — Novelka

> The full build broken into scoped, verifiable units, in dependency order.
> This file is written AFTER the product decisions in `progress-tracker.md` are locked.
> Each unit gets its own spec file `NN-feature-name.md`.

## Status: DRAFT — awaiting decision lock

See `context/progress-tracker.md` → Open Questions. The plan below is the intended
shape; unit order will be finalized once the owner confirms scope (fresh vs. refactor,
trim list, auth, cover depth).

---

## Intended unit outline (build order)

01. **Project skeleton** — clean Vite + React + TS + Fabric + Zustand baseline, token
    CSS, route shell (home / new-book / editor / export).
02. **Fixed-trim New Book flow** — standard KDP trims only, paper/binding/page-count/
    cover toggle, live spine/cover summary. Creates an interior-only or interior+cover
    book at the chosen trim.
03. **Editor shell** — canvas mount at trim size, page/layers docks, bottom bar, theme.
04. **KDP safe-area + preflight core** — margins/gutter/safe-area for every trim; the
    preflight checks all invariants; page thumbnails strip guides.
05. **Word Search generator** — grid, word bank, answer key, fit-sensing suggestions.
06. **Sudoku generator**
07. **Crossword generator**
08. **Maze generator**
09. **Handwriting generator**
10. **Parametric templates** — reusable at every supported trim.
11. **Cover surface** — flat cover with phantom guides (bleed/spine/safe/barcode), math
    from `kdp-cover.ts`.
12. **Export** — interior + cover PDF separation, KDP-valid.
13. **Home screen** — simple, clean, obvious next steps.
14. **Polish + hardening** — no dead controls, light/dark, a11y, full test pass.

---

## Rule reminders (from architecture.md)

- Guide overlays are DOM-only, never in page data/export.
- Generated pages build at interior trim size.
- Only fixed KDP trims; templates adapt to every supported trim.
- No free-form drag-and-drop design; layers/pages reorder is fine.
- Real font files only.
