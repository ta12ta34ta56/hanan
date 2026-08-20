# 12 — Process tracker (living memory)

**The next agent updates this file after every unit and every session.**
If this file is stale, you are failing the job.

---

## Snapshot

| Field | Value |
|---|---|
| Date (last update) | 2026-08-20 (floaty Text / Uploads) |
| Phase | Implementation. Templates section done. |
| Current unit | Floaty left tools — Text + Uploads first |
| Status | `FLOAT-LEFT` |
| Launch target | 2026-09-01 |
| Days remaining (as of last update) | 12 |
| Blocker? | Owner looks at Text / Uploads as a left card. Book should not slide. |
| Last agent action | Text and Uploads float over the book. Generators / inspector / templates unchanged. |

---

## Single next action

```
Owner looks at Text and Uploads: small card on the left, book stays still.
Do not float Generators or the colour box until they say this is right.
Do not connect Gammal storage.
```

---

## Phase checklist

- [x] P0 Documentation / memory folder (session 1)
- [x] Owner homepage + out-of-scope recorded (session 2)
- [x] Owner templates + generator panels recorded (session 4)
- [ ] Owner confirms simple path (handwriting, replace, pairs/variants)
- [ ] Rest of editor chrome recorded
- [x] Unit 01 Delete non-engine stack
- [x] Unit 02 New home (two buttons)
- [x] Unit 03 Create-a-book window (fields reordered in the same pass)
- [x] Unit 04 Quick Sudoku + Maze (basic window; lands in editor — A-06)
- [x] Unit 05 Editor chrome (cover window, fit, jump, fullscreen, rulers, text)
- [x] Editor units — generator panels (Unit 06)
- [x] Templates + temporary puzzle preview
- [ ] Buffer / demo

---

## Decisions made this session (2026-08-18 session 2)

From the owner, not guessed:

- Not Canva, ever. Low-content books in seconds. Individual app.
- Delete completely: Supabase, payments, admin, database, server, anything
  that is not the client engine.
- Home wipe. Only **Create a book** and **Quick puzzle making**.
- Create a book: Title (New Book) → Paper & binding (cover-creator list) →
  Cover ON + paperback/hardcover → standard trim → page count → editor.
- Quick: Sudoku + Maze, basic only. No advanced.
- Word search, crossword, handwriting → editor only.
- No custom size.

---

## Open owner questions

Only things the owner has not named. Do not invent answers.

| ID | Question | Why it is open | Needed by |
|---|---|---|---|
| Q-01 | The whole editor | Owner said "a lot more" and asked whether to continue | All editor units |
| Q-02 | Maze quick fields | **LOCKED:** trim, shape (default Square), difficulty, count | Unit 04 |
| Q-03 | After Quick Generate, where does the user land? | **ASSUMED A-06: editor** | Unit 04 |
| Q-04 | Exact most-used trim list if not the six already listed | Said "most used standard" | Create + Quick |
| Q-05 | Which paper stocks on Create a book? | **LOCKED: white + cream** | Create-a-book |
| Q-06 | Word search "words rose and moods" | **CLOSED:** Word Rules & Modes = 8 directions + secret message | WS panel |
| Q-07 | Handwriting = templates only, not hub? | **ASSUMED A-08: yes.** Removed from hub. | Templates |
| Q-08 | Maze basic fields | **LOCKED** (session 5) | Quick + Maze panel |
| Q-09 | Maze entrance include **right**? | Owner named top/bottom/left. Rec: keep right too | Maze panel |

---

## Assumptions log

| Date | ID | Assumption | Why | Status |
|---|---|---|---|---|
| 2026-08-18 | A-01 | Ship 2026-09-01 | 15 days from 2026-08-18 | standing |
| 2026-08-18 | A-02 | Word Search is the only launch hero | Session 1 | **REVOKED** by owner notebook |
| 2026-08-18 | A-03 | Server stays frozen in the tree | Session 1 | **REVOKED** — owner said delete |
| 2026-08-18 | A-04 | Launch trims = 6 listed in D-09 | Still used until owner names another list | standing, Q-04 |
| 2026-08-18 | A-05 | "cross word search and handwriting" = WS + crossword + handwriting | Language parse. Owner can correct. | standing |
| 2026-08-19 | A-06 | Quick Generate opens the editor | Q-03 unnamed; smaller option | standing |
| 2026-08-19 | A-07 | One difficulty per Generate (not multi-select) | Owner said "Difficulty" singular | **REVOKED** — owner: multi-select, as before |
| 2026-08-19 | A-08 | Handwriting = templates only | Q-07 recommended path | standing |
| 2026-08-19 | A-09 | Puzzle preview uses one canned sample (16×16 easy, seed 42) | Preview must stay fast | standing |
| 2026-08-20 | A-10 | Text/Uploads close with × / Escape / same icon, not tap-outside | Owner unsure; smaller option so the book stays clickable | standing |

---

## Work log (append a one-liner per unit)

| Date | Unit | Result | Tests | Notes |
|---|---|---|---|---|
| 2026-08-18 | docs | Handover folder created | n/a | No code |
| 2026-08-18 | docs | Owner notebook homepage recorded | n/a | No code. Waiting on editor. |
| 2026-08-18 | 01 | Deleted server/admin/payments/Supabase; guest create; no custom trim UI | lint, tsc, launch suites, build | ISS-004/005/011/019/032 done |
| 2026-08-19 | 02 | Two-button home + Quick Sudoku/Maze + Create-a-book field order | tsc, oxlint, nav-flow, kdp | A-06 editor after generate |
| 2026-08-19 | 05 | Editor chrome: fit, jump 9/100, FS preview, rulers off, margins, Heading+Body | tsc | Cover creation uses book trim |
| 2026-08-19 | 06 | Generator panels: dest/replace/auto-add, lock after Generate, no ppp | dest, sudoku, maze, cw, ws, live, tsc | Handwriting out of hub. BUG-037 |
| 2026-08-19 | templates | Ghost preview on canvas; page templates preview/apply/color/variants; HW under Templates | tsc, dest, sudoku, maze, cw, ws, hw, live, templates (101731), groups (16) | Cover never previewed. Lined siblings. |
| 2026-08-19 | templates follow-up | Preview look folded into Advanced; cached preview; folio off; dotted/graph/half-lined variants + example pair | tsc, dest (23), sudoku, maze (52), cw (42), ws (30+49), live (38+22), templates (171289), groups (16) | Do not redo home/cover. |
| 2026-08-19 | templates gallery | Family card → sibling/pair folder. Fake Notes pair removed. Pair apply = L/R auto. | tsc, groups (18), templates (167829) | Safe-area redesign waits. |
| 2026-08-19 | templates safe-area | Page templates fit every locked trim. Real gallery cards. Cover skipped for gutter. | tsc, oxlint, groups (23), templates (171576) | Next: storage honesty. |
| 2026-08-19 | puzzle chrome | After Generate, only the puzzle locks. Quotes / titles stay free. Journal chrome inside every locked trim. | tsc, oxlint, dest (28), sudoku, maze (52), cw (42), ws (30+49), live (38+22) | Next: storage honesty. |
| 2026-08-19 | gutter growth | Adding pages widens the gutter. Existing templates now refit into the new safe box so warnings stop. Guides skip the cover. | tsc, oxlint, dest, safe-reflow | Next: storage honesty. |
| 2026-08-19 | gutter + cream | Guides use interiors only. Generators layout to the real book count. Cream paper = cream canvas. Painted cream/kids page fills removed. | tsc, oxlint, dest (35), safe-reflow (14) | Next: multi-select difficulty. |
| 2026-08-19 | multi-diff + slide | Difficulty chips multi-select again. Past 150: slide off the spine, do not squash puzzles. | tsc, oxlint, dest (35), safe-reflow (18) | Next: storage honesty. |
| 2026-08-19 | gutter category | Cover never counted. Page 1 = first interior. Cross 150/300/500/700 remakes the same book. | tsc, oxlint, dest (35), safe-reflow (18), gutter-band (19), groups (23) | Next: storage honesty. |
| 2026-08-19 | lines & grids | Rulings pulled inside the safe box (stroke inset + isometric clip). Apply keeps the paper colour. | tsc, oxlint, lines-safe (113930) | Next family: page templates. |
| 2026-08-19 | lines workflow | Apply to back in the left rail. Click a card applies and closes. Customize lost Replace + Apply button. No live slider rebuild. | tsc, oxlint | Wait for owner confirm, then page templates. |
| 2026-08-19 | apply-to leftover | Apply to was still hidden on Lines (`cat !== 'lines'` never left). Now shown except Covers. Looked at planners. | tsc | Wait for owner on planner leftovers. |
| 2026-08-19 | page templates | Grey zebra / day-name / weekday washes removed. Certificate deleted. | tsc, oxlint, test:templates | Then puzzle frames. |
| 2026-08-19 | puzzle frames | Numbered card no paper paint. Worksheet timer fits the box. | tsc, oxlint, puzzle-frames (4827) | Wait for owner confirm, then handwriting. |
| 2026-08-20 | puzzle texts | Short titles hug the words — no empty selection skeleton. | tsc, oxlint, puzzle-frames (6573), templates (171440), dest (35) | Wait for owner confirm, then handwriting. |
| 2026-08-20 | handwriting | Titles hug. 0.70pt rule is 0.75. Chrome inside the safe box. | tsc, oxlint, handwriting (94), handwriting-safe (1368) | Then storage / export. |
| 2026-08-20 | export + RAM | PDF only. No combined. Two files: name-interior.pdf and name-cover.pdf. Undo clones this page only. | tsc, oxlint | Owner looks. |
| 2026-08-20 | float left | Text + Uploads are a small left card over the book. Page does not slide. | tsc | Wait for owner. Then colour box, then Generators. |

---

## How to update this file (every session)

1. Set Date, Current unit, Status, Days remaining.
2. Rewrite **Single next action**.
3. Tick phase checkboxes.
4. Append Work log.
5. Log assumptions. Revoke old ones when the owner overrides.
6. Append `15-SESSION-LOG.md`.
