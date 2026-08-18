# 15 — Session log (append only)

Newest session at the top.

---

## 2026-08-18 Unit 01 — Delete non-engine stack

**Code changed:** yes.

Deleted `novelka/server/**`, `src/admin/**`, admin.html, AdminPanel, OwnerGate,
AuthModal, RatingModal, UpgradePrompt, payments, admin-access, auth, feature-flag
implementation, content-registry, `@supabase/supabase-js`. Guest can create and
export. Custom trim and Import PDF removed from customer UI. Export has no
paywall watermark. Trim picker is the six D-09 sizes. Papers in setup: white +
cream.

**Verify:** `npm run lint`, `tsc -b`, `test:kdp`, `test:engine`, `test:wordsearch`,
`test:cover-guides`, `test:preflight`, `test:quick-flow`, `test:nav-flow`,
`test:project-flow`, `npm run build`.

**Next:** Unit 02 new home.

---

## 2026-08-18 handoff — PR for the next agent

Owner asked: is this done, can another agent fix from this repo?
Honest answer: this branch is **docs only**. The next agent must implement.
Tracker flipped to `READY-FOR-IMPLEMENTATION`. Start Unit 01.

---

## 2026-08-18 session 6 — Cover + workspace chrome

Owner: Cover creation (no trim, no page count, darker bg). Cover
bleed/reference lines drift on zoom and look too thick — want thin red
like bleed zone. Margins toggle dead. Jump = `9/100`. Preview
fullscreen = no chrome. Fit on editor open. Rulers default off. Text =
Heading + Body, no Canva plate. No code.

---

## 2026-08-18 session 5 — Word Rules & Modes + maze

Owner: Q-06 is **Word Rules & Modes** (8 direction chips + secret leftover
message). One font covers digits/letters AND puzzle number AND difficulty.
Maze basic = shape (default Square) + difficulty + count. Keep start/finish
and entrance. Answers 1/4/6, no 9. Maze preview: resize, recolor, thickness.
No code.

---

## 2026-08-18 session 4 — Templates + generators

Owner: paper = white + cream. Then editor: pairs, variants, preview,
puzzle-template → temp preview + left generator, lock after generate,
strip puzzles-per-page / placement / safe-area, auto-add pages,
handwriting maybe templates-only. Wrote the simple path into the
notebook. No code. Waiting for owner to say "yes that's what I meant".

---

## 2026-08-18 session 3 — Paper stocks, advice only

Owner asked whether to keep white / cream / groundwood / colour papers.
Explained: paper changes spine math + KDP page limits, not the puzzle.
Recommended **white only for v1**. Not locked. Waiting for owner yes/no.
No code.

---

## 2026-08-18 session 2 — Owner notebook (homepage + delete)

**Agent role:** listen and write. **Code changed:** none.

### What the owner said
- Not Canva at all. Low-content books, automated, personal, individual.
- Delete completely: Supabase, payments, admin, database, server, anything
  that is not the client engine.
- Wipe the current home. Two things only: **Create a book** and
  **Quick puzzle making**.
- Create a book window: Title (New Book) → Paper & binding (same five
  stocks as the cover creator) → Cover on by default + paperback/hardcover
  → standard trim (no custom) → page count → editor.
- Quick: Sudoku (4×4/9×9/16×16, difficulty, count) and Maze (basic).
  No advanced. Word search / crossword / handwriting = editor only.
- Asked whether to send the editor now or later.

### What changed in this folder
- New `16-OWNER-NOTEBOOK.md` (highest product authority).
- Session-1 Word Search wizard-first locks marked SUPERSEDED.
- Delete list: freeze → **delete**.
- Tracker status: `WAITING-FOR-OWNER-EDITOR`.

### What the next session must do
Write the editor when the owner sends it. Do not build yet.

---

## 2026-08-18 — Documentation / memory only

**Agent role:** handover writer. **Code changed:** none.

### Why
Owner: first beginner app, ~2 months, college in 15 days. Do not fix code.
Write a folder of issues, redesign, architecture, process tracking, and
bug tags so a *new* agent can work without the owner prompting. Many things
are permanently out of scope. The output of the product is very different
from the current Canva-like app.

### What was found
- `novelka/src` ≈ 51.8k lines, 164 TS/TSX files.
- Two products in one tree: a Fabric design editor + a book-producer wizard.
- Five generators are real and tested. KDP math is real and tested.
- Payments, admin, flags, ads, custom sizes, sticker rail still live in the
  customer app.
- Docs contradict each other (STATUS says deploy Stripe next; context says
  no payments; Blueprint says wizard-first; README says Canva Phase 1).
- `context/progress-tracker.md` still had open questions. Those are now locked
  in `02-DECISIONS.md`.

### What was written
The entire `/handover` folder (this file included).

### What the next session must do
Start **Unit 01 — Customer-clean**. See `12-PROCESS-TRACKER.md`.

### Verification
Not applicable (no app code).
