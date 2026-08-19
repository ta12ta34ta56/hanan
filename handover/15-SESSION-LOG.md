# 15 — Session log (append only)

Newest session at the top.

---

## 2026-08-19 — Puzzle locked, quotes free, chrome inside safe area

Owner: after Generate only the puzzle itself is fixed. Quotes and other
text around it stay movable so people can put their own line. Some Sudoku
templates still warned that text sat outside the KDP safe area. Check
every puzzle template at every locked trim.

- Lock whitelist: grid / letters / walls only. Titles, quotes, maze chrome
  and instruction lines stay selectable.
- Puzzle chrome sits inside the safe box at 6×9 / 8.5×11 / 8×10 / 7×10 /
  5.5×8.5 / A4. Footer quotes, A–I rails, HARD stars and sprigs pulled in.
- Sudoku and maze pages now clamp the same way crossword / word search do.

**Next:** storage honesty. Do not redo home, cover, generators, or templates.

---

## 2026-08-19 — Templates inside the safe area + real cards

Owner: every template must sit inside the KDP safe area at every locked
trim (warnings when choosing one). Early planner cards looked like empty
shapes. Then look for contradictions / crashes.

- Page templates rebuild inside the safe box at 6×9 / 8.5×11 / 8×10 /
  7×10 / 5.5×8.5 / A4. Planners scale with the page. Certificate no
  longer paints the full sheet. Kids/journal puzzle chrome stays inside.
- Gallery cards for page templates show a real miniature of the page.
- Applying a template skips the cover when numbering pages, so the
  gutter stays on the correct side.
- Puzzle cards open the generator (ghost preview) instead of stamping
  chrome. Handwriting is listed under Templates.

**Next:** storage honesty. Do not redo home, cover, generators, or templates.

---

## 2026-08-19 — Basic pair + Lines customize on top

Owner: no PAIR card visible; make a basic pair. Lines & Grids: take
"Apply to this page" off that spot; put Customize at the top.

Added Daily notes left/right pair. Lines customize (color, spacing,
weight) is first. Apply-to dropdown removed from Lines & Grids.

---

## 2026-08-19 — Template gallery: family → sibling folder

Owner: one card per family with a VARIANTS / PAIR badge. Click opens a
second screen of siblings only (Book Bolt). Pair select fills the book
left / right automatically. Do not invent pair art. Safe-area redesign
waits until this gallery works.

Removed the fake Notes pair. Lined / Dot grid / Graph / Sketch+write
collapse to one card each.

**Next:** confirm the folder. Then safe-area redesign of every template.

---

## 2026-08-19 — Preview polish + line variants

Owner: crossword letter spacing dead; preview sliders too slow; only Basic
visible; folio on crossword clues; templates need wideness/thickness
variants and one example pair (safe to delete later).

- Preview look lives inside Advanced on Sudoku / Maze / WS / Crossword.
  Generate bar stays at the bottom.
- Preview caches the puzzle; style ticks rebuild pages only (90ms debounce).
  Crossword letterSpacing now hits clue text + answer letters. WS spacing
  is a range.
- Folio default off on sudoku / maze / ws / crossword. Minimal templates
  print a number only when folio is set.
- Lined already had siblings. Dotted / graph / sketch+write now have
  Standard + Wide + Bold. Example pair: Notes left/right (TODAY / TOMORROW).

**Next:** storage honesty. Do not redo home, cover, generators, or templates.

---

## 2026-08-19 — Templates + temporary puzzle preview

Owner: cannot see the temporary preview of puzzles; next is templates;
preview so the user knows what they are doing before Generate.

Puzzle templates open the generator. A ghost overlay (`novelkaGhost`) sits
on the interior canvas and updates as inputs change. Generate writes real
pages and locks the puzzle. Opening Generators with no template uses
`classic` (same as Quick Puzzle). Cover is never previewed or stamped.

Page templates: click = preview on canvas, line color only, Apply this /
all / blank. Lined Standard/Thin/Wide/Bold share one Variants card. Pair
badge + verso/recto apply rule (no invented pair art). Handwriting lives
under Templates; preview is one letter, Apply fills the book.

**Verify:** `tsc -b`, oxlint (warnings only), `test:destination` (23),
sudoku, maze, crossword, wordsearch, handwriting (94), live (38+22),
`test:templates` (101731), template-groups (16).

**Next:** storage honesty. Do not redo home, cover, generators, or templates.

---

## 2026-08-19 — Unit 06 generator panels

Owner: go on with the other stuff we planned. Cover is done. Do not redo
home or cover.

Shared destination: All pages / Blank only / Append + Replace. Auto-add
interiors if the book is too short. Cover never touched. Puzzle content
locks after Generate; title / number / difficulty stay editable.

Deleted from every panel: puzzles-per-page, placement, KDP safe sliders,
apply-to-all. Density comes from the template. One font. Solutions only
counts that fit (maze 1/4/6, crossword 1/2/4, sudoku no 9).

Handwriting removed from the generator hub (A-08). Crossword overlap
fixed (no black blocks, clue box has a height, shrink-to-fit, both-mode
no longer stacks answers on Down). Custom crossword lists drop junk and
fail honestly.

**Verify:** `tsc -b`, oxlint on touched files, `test:destination` (23),
`test:sudoku`, `test:maze`, `test:crossword`, `test:wordsearch`,
`test:live`.

**Next:** storage honesty. Do not redo generators.

---

## 2026-08-19 — Unit 05 editor chrome

Fit page on editor open. Jump always shows `9/100` (interior). Preview
Fullscreen hides chrome. Rulers default off. Margins toggle actually
draws. Text = Heading + Body, no gray plate. Cover creation window:
no trim picker, no page-count slider, white/cream only, button
**Create a KDP cover**. Snap/guides verified in engine — kept.

---

## 2026-08-19 — Cover overlay: no measurements, panel bleed lines

Owner: drop every measurement label. Keep only title / author / back
copy. Draw a bleed **line** all around the front page and all around
the back page so the limits are obvious.

---

## 2026-08-19 — Cover isolation + official template texts

Owner: red on the spine; cover isolated from templates/generators/reorder;
put default title and texts back; check the math.

- Cover guides: Amazon pink bleed including extra-visible red on the
  spine top/bottom, black trim + spine-edge lines, blue folds, yellow
  barcode, live measurement labels (never export).
- Cover cannot be dragged / double-click moved. Templates and generators
  refuse the cover. Default cover texts restored (book title / subtitle /
  author / blurb). Dark default fill `#2a2f38`.
- Locked Amazon 6×9 / 131 / white: spine 0.295", wrap 12.545" × 9.250".

---

## 2026-08-19 — Unit 02 home

Wiped the landing page to **Create a book** + **Quick puzzle making**.
Nav is Home + Projects. Quick generates Sudoku or Maze (basic) and opens
the editor (A-06). Create-a-book field order matches the notebook.

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
