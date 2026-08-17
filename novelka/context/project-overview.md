# Project Overview — Novelka

> This is the single source of truth for **what** Novelka is, **why** it exists, and
> **what is in/out of scope**. When a spec is ambiguous, resolve it against this file.
> If a feature is not listed here as in-scope, do not build it.

---

## One-paragraph overview

Novelka is a web app that turns a puzzle idea into a **print-ready KDP low-content book**
in minutes. A user picks a standard KDP trim size, chooses a generator (word search,
Sudoku, crossword, maze, or handwriting), sets the volume (page count / puzzles per
page / answer placement), and Novelka lays out the entire book — puzzles, answer key,
and cover — into pages that respect KDP gutters, bleed and safe margins. The editor
lets the user inspect, reorder, and lightly edit pages, and a built-in preflight check
confirms the book is export-ready before it is exported as PDF.

---

## Goals

1. **One-click book production.** From "I want a 6×9 word search book with 50 puzzles"
   to a valid KDP book with as few clicks as possible — no setup rabbit holes.
2. **KDP-valid by default.** Every generated page sits inside the safe area for the
   chosen trim; gutters, bleed and page count rules are enforced automatically, not
   left to the user.
3. **Simple and predictable.** A beginner can produce a book without reading docs.
   Fewer options, clearer defaults, no dead controls.
4. **Fixed, reusable trims.** Only the standard KDP trim sizes are offered (no custom
   sizes). Templates and generators adapt to any of the supported fixed trims.
5. **Stable and boring.** No crashes, no half-finished features, no fragile drag-and-drop
   canvas editing. The app is small enough to be reliable.

---

## Core user flow (start to finish)

1. **Land** on the home screen.
2. **Start a new book** — choose the **trim size** (fixed KDP list), **paper** (white /
   cream / groundwood), **binding** (paperback / hardcover), **page count**, and whether
   to include a **cover**. (This is the one setup step; it is the same for every
   generator and template.)
3. **Pick a generator or template** (word search, Sudoku, crossword, maze, handwriting,
   or a parametric template).
4. **Set the volume** (number of puzzles, puzzles per page, solutions placement) with
   only options that actually fit the chosen trim.
5. **Generate.** Novelka builds every page at the book's interior trim size, including
   answer-key pages and (optionally) the cover.
6. **Review** in the editor: see all pages, reorder them, light-edit elements. The cover
   is a separate flat surface with phantom bleed/spine/safe-area guides.
7. **Run preflight** — Novelka reports any page that would be unsafe to print, with the
   specific reason and a fix.
8. **Export** to PDF (interior and cover as separate files, as KDP requires).

---

## Features

### Generators (in scope)
- **Word search** — theme banks / custom word lists, adaptive grid, word-bank column,
  back-of-book or after-each answer key, secret leftover message.
- **Sudoku** — 4×4 / 9×9 / 16×16, difficulty levels, symmetric, answer key.
- **Crossword** — themed clue banks / custom lists, adaptive grid, ACROSS/DOWN layout,
  answer key.
- **Maze** — square / circular / triangular / hexagonal, difficulty, start/finish,
  optional solution, answer key.
- **Handwriting** — uppercase / lowercase / numbers, guide lines, traced copies,
  practice rows, optional title page.

### Book / layout (in scope)
- Fixed KDP trim sizes only (no custom sizes).
- Interior page layout that respects the KDP safe area for the current trim + gutter
  (recto/verso aware).
- Answer-key pages placed per the module's solution setting.
- Parametric templates (planner / interior / school / puzzle) that adapt to every
  supported trim.
- **Cover** — a clean, isolated flat surface (back + spine + front + bleed) with
  phantom bleed / spine / safe-area / barcode guides; spine math from KDP.

### Editor (in scope — light editing only)
- Pages panel (reorder, add, duplicate, delete) and Layers panel (reorder, lock, hide).
- Select / move / resize / recolor elements and text (fonts use real bold/italic files).
- Undo / redo.
- **No drag-and-drop free-form canvas assembly** — see Out of scope.

### Export / preflight (in scope)
- KDP preflight: safe-area, gutter, page-count, thin-lines, text-readability, cover /
  interior separation.
- PDF export (interior + cover files).

---

## Out of scope (explicitly NOT building)

- **Free-form drag-and-drop graphic design.** Novelka is a book *producer*, not a
  Canva/designer. Do not build arbitrary canvas arrangement, free rotation of arbitrary
  elements, or free-form shape assembly as a headline feature.
- **Custom trim sizes.** Only the fixed KDP trim list. No custom width/height input.
- **Payments / subscriptions / marketplace / admin back-office.** Not part of the
  customer product.
- **Collaborative real-time editing.**
- **A general-purpose image editor** (filters, layers-as-photoshop, masking).
- **Mobile-first native app** — this is a desktop/web tool (responsive, not mobile-first
  primary).
- **AI that generates puzzle content from free text** (the generators are rule-based).

---

## Success criteria

- [ ] A signed-in/guest user can create a valid KDP book (24+ pages) from a generator
      in under ~10 clicks, with no manual margin work.
- [ ] Every generated page at every supported trim passes the KDP preflight with zero
      content-outside-safe-area violations for standard content.
- [ ] The app runs with no console errors and no crashes across a full create → edit →
      export session.
- [ ] All offered options actually work (no dead sliders, no non-functional controls).
- [ ] The full unit test suite passes before any unit is considered done.
