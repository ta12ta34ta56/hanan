# 12 — Process tracker (living memory)

**The next agent updates this file after every unit and every session.**
If this file is stale, you are failing the job.

---

## Snapshot

| Field | Value |
|---|---|
| Date (last update) | 2026-08-19 (Unit 06 generator panels) |
| Phase | Implementation. Unit 06 generator panels done. |
| Current unit | **Unit 06 leftover — storage / crash honesty** |
| Status | `UNIT-06-DONE` |
| Launch target | 2026-09-01 |
| Days remaining (as of last update) | 13 |
| Blocker? | None. |
| Last agent action | Generator panels: no puzzles-per-page, lock after Generate, auto-add pages, handwriting out of hub, crossword overlap fixed. |

---

## Single next action

```
Unit 06 leftover / storage honesty.
Read handover/16-OWNER-NOTEBOOK.md and 11-15-DAY-PLAN.md Unit 06 (storage).

Autosave warn, huge-book warn, projects open/preview/export/delete.
Do not redo home, cover, or generator panels.
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
| 2026-08-19 | A-07 | One difficulty per Generate (not multi-select) | Owner said "Difficulty" singular | standing |
| 2026-08-19 | A-08 | Handwriting = templates only | Q-07 recommended path | standing |

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

---

## How to update this file (every session)

1. Set Date, Current unit, Status, Days remaining.
2. Rewrite **Single next action**.
3. Tick phase checkboxes.
4. Append Work log.
5. Log assumptions. Revoke old ones when the owner overrides.
6. Append `15-SESSION-LOG.md`.
