# 09 — Bug registry

Runtime defects, silent data loss, and known traps.

**Severity:** `S0` crash/data-loss · `S1` golden-path broken · `S2` wrong output
· `S3` polish · `S4` docs/process
**Status:** `open` · `in-progress` · `fixed` · `wontfix` · `accepted`
**Launch:** `blocker` · `should` · `later` · `out-of-scope`

How to add one: copy `templates/BUG.md`, next BUG-xxx, add a row here.
Search by tag (`tags.md`) before filing a duplicate.

---

## Index

| ID | Title | Sev | Launch | Status | Tags |
|---|---|---|---|---|---|
| BUG-001 | Two EXTRA_PROPS allow-lists silently drop tags | S1 | should | open | area:editor tag:serialization |
| BUG-002 | Template chrome not re-laid on resize | S3 | later | accepted | area:generator |
| BUG-003 | Same-page-bottom answers missing | S3 | later | accepted | area:generator |
| BUG-004 | Client flags/tiers editable in DevTools | S2 | out-of-scope | wontfix | area:auth |
| BUG-005 | Admin not enforced server-side | S2 | out-of-scope | wontfix | area:admin |
| BUG-006 | Stripe cancel-on-delete not injected | S2 | out-of-scope | wontfix | area:payments |
| BUG-007 | Custom fonts rasterized / Helvetica text layer | S2 | later | open | area:export |
| BUG-008 | React.StrictMode disabled (Fabric double mount) | S3 | later | accepted | area:editor |
| BUG-009 | Exposed Supabase service-role key (2026-07-28) | S0 | out-of-scope | owner-action | area:auth |
| BUG-010 | Sandbox OOM from leftover Vite/Chrome | S1 | should | open | area:perf |
| BUG-011 | `requireEditorAuth` blocks guests | S1 | blocker | open | area:auth |
| BUG-012 | Autosave used to fail silently (fixed, guard it) | S0 | should | fixed | area:storage |
| BUG-013 | Page metadata stripped on navigate (sudoku, fixed) | S1 | later | fixed | area:editor |
| BUG-014 | Live-adjust drift / measure-then-nudge (fixed) | S2 | later | fixed | area:generator |
| BUG-015 | Word-search size slider dead above ~50% (fixed) | S2 | later | fixed | area:generator |
| BUG-016 | Maze non-rect shapes printed as solid grids (fixed) | S1 | later | fixed | area:generator |
| BUG-017 | Handwriting dash walker collapsed corners (fixed) | S2 | later | fixed | area:generator |
| BUG-018 | Handwriting `phraseFor` X discarded by template (fixed) | S3 | later | fixed | area:generator |
| BUG-019 | Unclaimed install treated everyone as owner (fixed) | S1 | out-of-scope | fixed | area:admin |
| BUG-020 | Flag migration wiped `routes` / made ad features free (fixed) | S2 | out-of-scope | fixed | area:payments |
| BUG-021 | Rate limit is per-instance only | S3 | out-of-scope | wontfix | area:perf |
| BUG-022 | PDF import text is raster, not editable | S3 | out-of-scope | accepted | area:editor |
| BUG-023 | Preflight honesty vs marketing copy | S2 | should | open | area:kdp |
| BUG-024 | Cover can be included in interior operations if role is missing | S1 | should | open | area:kdp |
| BUG-025 | Generated pages at wrong size if New Book skipped | S1 | blocker | open | area:kdp |
| BUG-026 | Large books can exhaust GPU / memory (preview/export) | S1 | should | open | area:perf |
| BUG-027 | `window.confirm` for autosave restore | S3 | later | open | area:ux |
| BUG-028 | Crossword/WS/Sudoku "apply to all" can no-op if canvas ≠ store | S2 | later | open | area:editor |
| BUG-029 | Storage full after a long session — user may not notice until refresh | S1 | should | open | area:storage |
| BUG-030 | Conflicting trim lists produce non-KDP PDFs | S1 | blocker | open | area:kdp |
| BUG-031 | Cover bleed/reference lines drift on zoom | S1 | blocker | open | area:editor |
| BUG-032 | Show margins toggle does nothing | S2 | should | open | area:editor |
| BUG-033 | Smart guides / snap suspected dead | S2 | should | open | area:editor |
| BUG-034 | Preview fullscreen still has chrome | S2 | should | open | area:ux |
| BUG-035 | Editor open does not fit page to workspace | S2 | should | open | area:ux |
| BUG-036 | Text presets look like Canva (plate + extra styles) | S3 | should | open | area:ux |

---

## Open / launch-relevant details

### BUG-001 — Two EXTRA_PROPS allow-lists
**Where:** `engine/canvas-engine.ts` `EXTRA_PROPS` AND
`modules/shared/puzzle-utils.ts` `PUZZLE_EXTRA_PROPS`.
**Symptom:** page looks fine; live-adjust / grouping dies after save/reload.
Handwriting once lost 667/667 tags.
**Rule:** D-22. Any new persisted custom prop goes in **both**.
**Launch:** do not add new props unless a unit requires it. If you do, add both
and add a round-trip test.

### BUG-002 — Template chrome not re-laid
Grids stay in slot; decorative chrome is page-anchored. Accepted for launch.

### BUG-003 — Same-page-bottom answers
Only `back_of_book`, `next_page`/`after each`, `none`. Accepted.

### BUG-004 / BUG-005 / BUG-006 / BUG-021
Old security/payments track. **wontfix for launch** (no money, no admin).

### BUG-007 — Font embedding
Hybrid PDF uses Helvetica for the selectable layer; custom fonts rasterize.
Non-Latin-1 → `?`. Acceptable for English Word Search launch. Do not start
a fontkit project unless export is broken.

### BUG-008 — StrictMode off
Fabric dies on double mount. Leave it. Do not "fix React" in a launch unit.

### BUG-009 — Exposed key
Owner action. Agent must **never** put secrets in git, chat, or `.env` commits.
If you see a secret in the tree, do not copy it. Note it in the tracker.

### BUG-010 — OOM
Before browser/preview tests:
`pkill -f "[v]ite.*preview"; pkill -f "[h]eadless_shell"`
Tests should `localStorage.clear()` if they boot a huge last project.

### BUG-011 — Guest wall
`App.tsx` `requireEditorAuth` opens AuthModal whenever
`isSupabaseConfigured() && !authUser`.
This **violates D-05**. Unit 01 must remove the gate from create / open /
preview / export.

### BUG-012 — Autosave silence (fixed)
`storage.autosave()` returns false; App warns once. **Do not regress.**
Never swallow `StorageFullError`.

### BUG-023 — Preflight honesty
Copy must not say Amazon-guaranteed. Blockers vs warnings must match
`domain/preflight.ts`. Unit 04.

### BUG-024 — Missing `role` defaults to interior
`isInterior` treats missing role as interior. A cover without `role: 'cover'`
gets numbered / exported as interior.
**Guard:** any path that creates a cover must set the role. Preflight should
flag a page whose size looks like a wraparound cover but role is interior.

### BUG-025 — Wrong trim if setup skipped
Comments in App already say "never silently start a hardcoded size".
Audit every "create project" path (home module cards, cover-only, wizard,
New Book). All must stamp `book.trim*`.

### BUG-026 — Memory
Preview already LRU-caches and caps. Export of 100+ pages can still blow a
weak machine. Wizard should keep default volume modest (25 puzzles, not 300).
Show progress. Allow cancel.

### BUG-027 — `window.confirm` restore
Works. Replace only in a polish unit if you are already in that file.

### BUG-028 — apply-to-all stale store
Historically a silent no-op. Deterministic layout fixed the main case.
If you touch apply-to-all, sync canvas → store first.

### BUG-029 — Storage full
Warn on failed autosave (done). Also warn **before** generate if a 50-puzzle
book will likely not fit. Nice-to-have in Unit 05.

### BUG-031 — Cover guides drift on zoom
`CoverGuides` SVG overlay vs zoomed canvas. Owner: zoom in/out and the
cover and the bleed/reference lines go different directions. `zoom` is
passed in and unused. Overlay must share the page transform. Draw **thin
red** like interior bleed — not thick multi-color boards.

### BUG-032 — Show margins is dead
Renders only if KDP guides are off. KDP guides default on. Toggle lies.

### BUG-033 — Smart guides / snap
Owner says they do not work. Verify. Fix or delete the buttons.

### BUG-034 — Preview fullscreen
Must be true fullscreen, no boards/chrome.

### BUG-035 — Fit on editor open
`zoomToFit` exists; it is not run when entering the editor.

### BUG-036 — Text panel Canva look
Remove Subheading/Caption. No gray plate. Theme text only (white/black).

### BUG-030 — Conflicting trim lists
`PAGE_SIZE_PRESETS`, `TRIM_PRESETS` in book.ts, Blueprint 7×9, KDP_TRIM_SIZES.
Picker must be exactly D-09. Generating at a non-listed size is a launch bug.

---

## Fixed bugs kept as memory

Do not reintroduce. If you touch the module, read its `NOTES.md`.

- BUG-013 metadata stripped on `syncActivePage`
- BUG-014 layout drift
- BUG-015 WS slider cap ignored template slots
- BUG-016 maze wall matching by float keys
- BUG-017 handwriting line-stroke dash walker
- BUG-018 template rebuilt "X is for" and dropped "Box ends with X"
- BUG-019 unclaimed install = everyone is owner
- BUG-020 shallow flag merge

Module NOTES also list many more fixed items (crossword pitch, clue wrap,
sudoku line coords, pinched bowls, …). Those NOTES are the module memory.
