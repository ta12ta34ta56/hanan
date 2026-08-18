# 16 — Owner notebook (highest product authority)

**This file is the owner's words, organized.**
It beats every earlier decision in this folder, including the 2026-08-18
Word-Search-wizard plan.

- Status: **IN PROGRESS** — homepage, paper, templates, and generator
  panels recorded. Other editor chrome (pages dock, export, cover inside
  editor) not received yet.
- Do not invent what the owner did not name.
- Do not implement until the owner says the notebook is enough to build.

Raw source: owner voice notes, 2026-08-18, session 2.

---

## Product (owner words)

Novelka is **not Canva**. Not under any circumstance. Not a graphic design
app. Not for huge stuff. Not for organizations.

It is a **personal, individual app** that creates **low-content books in
seconds**, with no manual work. Rules are already enforced. The user clicks,
the book is ready to publish. The goal is to help people and save their time
and money. Easy. Smooth.

---

## Permanently out — delete completely

Not "hide". Not "freeze in the repo". **Delete.**

Owner: even if something was not named, if it is not the **app engine /
client-side book app**, it goes.

| Named by owner | Meaning in this repo | Action |
|---|---|---|
| Supabase | `@supabase/supabase-js`, auth adapter, env keys, docs | Delete |
| Payments / subscriptions | Stripe, `payments.ts`, checkout, UpgradePrompt, prices | Delete |
| Admin | `src/admin/**`, `AdminPanel`, `OwnerGate`, `admin-access`, `admin.html` | Delete |
| Database | `server/db`, schema, RLS, remote profiles | Delete |
| Server | `novelka/server/**` entire package | Delete |
| Anything like those | feature flags as a paywall, ads, entitlement API, ratings-to-server, GDPR server routes | Delete |

**In scope right now:** the client app + the engines (generators, KDP math,
canvas/export that the book needs).

Owner has other GitHub repos. Do not be afraid to delete from this one.

---

## Homepage — `novelka.space`

**Remove everything** that is on the current home page.

After the wipe, a visitor sees **only**:

1. **Create a book** — the main button
2. **Quick puzzle making** — beside it

No other cards, no generator gallery as the hero, no templates marketplace,
no import PDF, no sign-in wall, no ratings, no social, no "open editor" as
the first action.

---

## Button A — Create a book

Click → a window pops up. Then the user goes **into the editor**.

Order of fields:

1. **Title**
   - Default text: `New Book`
2. **Paper** — **LOCKED: white + cream only** (owner chose option 2).

   | id | Label | Note |
   |---|---|---|
   | `white` | Black ink, white paper | Default. Most common |
   | `cream` | Black ink, cream paper | Journals / warmer paper |

   Groundwood, colour standard, colour premium: **not offered.**
   Spine math still uses the chosen stock. Quiet KDP hint: print as
   black ink on the paper they picked.

3. **Cover**
   - Cover is **on by default**.
   - If cover is on: user picks **Paperback** or **Hardcover**.
4. **Trim size**
   - Standard, most-used sizes only.
   - **No custom size.** Owner is a beginner and wants this easy.
5. **Page count**
6. **Create a book** → open the **editor** with that book.

That is the whole create-book window. Nothing else.

---

## Button B — Quick puzzle making

Click → a window. **Basic inputs only. No advanced settings.**

### Which puzzles are quick vs editor

| Puzzle | Quick window? | Owner rule |
|---|---|---|
| **Sudoku** | Yes | Trim + 4×4 / 9×9 / 16×16 + difficulty + how many + Generate |
| **Maze** | Yes | Trim + shape (default Square) + difficulty + how many + Generate |
| **Word search** | No | Must open the editor |
| **Crossword** | No | Must open the editor |
| **Handwriting** | No | Templates in the editor only — not a generator hub tool |

Heard as: *"for the cross word search and handwriting only they have to open
the editor."* Written as the three non-quick generators above. If that is
wrong, owner will correct in the next message. Do not add Word Search to
quick mode unless the owner says so.

### Sudoku quick fields (named)

- Trim size (same standard list, no custom)
- Grid: **4×4** / **9×9** / **16×16** (one of them)
- Difficulty
- How many puzzles
- **Generate**
- No advanced settings

### Maze quick fields

- Trim size
- Shape — **Square is the default**. Also circle, hexagon (and the existing triangle if we keep the current engine shapes)
- Difficulty
- How many puzzles
- **Generate**
- No advanced. No puzzles-per-page.

---

## Editor — templates + generators (session 4)

Owner: templates section is good; change it, do not throw it away.
Owner asked for the **simplest path** so this does not become Canva,
bugs, or extra work. The **Simple path** blocks below are that help.
They are the plan unless the owner corrects them.

### Two kinds of templates (do not mix)

| Kind | Examples | What the user does |
|---|---|---|
| **Page templates** | lined, journal, handwriting sheets | Preview one page → maybe change line color → apply to the book |
| **Puzzle templates** | a Sudoku frame, a maze frame, a word-search frame | Preview is **temporary**. Left panel = generator. Generate writes the book. Then the puzzle itself is **done / not editable** |

If you treat a Sudoku frame like lined paper ("edit it, then stamp every
page"), you get a mess. Puzzle templates open the **generator**, not
"apply this drawing to all pages".

---

### Page templates — pairs, variants, preview

**Pairs (left + right).**
In the future there will be two-page templates: one for the left page,
one for the right, a matched pair. Gallery card gets a small **Pair**
icon (two pages). Applying a pair: left design on verso (even), right
design on recto (odd). Single-page templates stay as they are (no icon).
Do not invent pair artwork. Build the badge + apply rule; owner adds
the actual pair files later.

**Variants (siblings).**
Some templates are the same idea with different line spacing / weight
(tight vs loose, thin vs thick vs bold). **One card** in the gallery,
with a **Variants** mark. Click the card → those 2–3 siblings
(Thin lines / Wide lines / Bold lines). Do not show three almost-same
cards in the main list.

**Preview (page templates only).**
A Preview control at the top of templates. Preview shows the template
on the canvas **before** applying to the book. For journals / lines:
user may change **line color** in that preview, then apply. That is
the whole pre-apply edit. Not a design editor.

**Simple path for page templates**

1. Gallery: card. Optional badges: Pair, Variants.
2. If variants: pick one sibling.
3. Preview on canvas. Lines: color only.
4. Apply: this page / all pages / blank pages only.
5. Stop. No sticker tools. No free-form drawing.

---

### Puzzle templates — temporary preview + generator, then lock

Example: user picks a Sudoku template.

1. That template sits on the canvas as a **temporary preview** (not a
   finished book page).
2. The **generator panel opens on the left**.
3. User sets inputs. Preview updates.
4. User clicks **Generate**.
5. Real pages are written. **The puzzle itself cannot be edited after
   that.** Title / puzzle number / difficulty text may stay editable.
6. If they want a different look, they pick another template and
   generate again (Replace), or append.

This is also how Maze, Word Search, and Crossword work.

**If they open Generators without picking a template:**
use the same **simplest / default template** that Quick Puzzle uses.
Advanced settings are still there. They can export a plain book and
decorate it in another app if they want. Freedom = basic template +
export, not a Canva rail.

---

### Shared generator rules (every puzzle generator)

**Keep**
- Basic settings first, **Advanced** folded under.
- **Browse templates** in Advanced: go to the gallery, pick another
  puzzle template, come back to this panel, preview again, then generate.
- Title.
- **One font for the whole puzzle family.** If the user picks a font for
  Sudoku numbers, that same font is used for the puzzle number and the
  difficulty line. Same rule on every generator: title / number /
  difficulty / puzzle letters-or-digits share the chosen font. Do not
  give them three font pickers.
- Solutions: **back of book** / **after each** / **none**.
- Solutions per page: only counts that **fit the trim**. Never show a
  number that will crash or overlap.
- Where the new pages go:
  - **All pages**
  - **Blank pages only**
  - **Append to the end**
- **Replace** then **Generate** (replace = overwrite the destination
  instead of stacking on top of old puzzles).
- If the book does not have enough interior pages for the requested
  puzzles **and** their solutions, **add pages automatically**. Never
  leave a half-generated book.

**Delete from every generator panel (owner: if I did not name it, it goes)**
- **Puzzles per page** — gone. Density comes from the **template**.
- **Placement** controls
- **KDP safe-area** toggles / "safe area" sliders
- **Update on all puzzles** / live apply-to-all while previewing
- Anything not listed in that generator below

**After Generate:** puzzle content is locked. Do not offer a second
editor for the grid / word list / maze walls.

---

### Sudoku panel

**Basic**
- 4×4 / 9×9 / 16×16
- Difficulty
- How many puzzles

**Advanced**
- Browse templates
- Document font
- Show puzzle number
- Show puzzle difficulty
- Solutions: back / after each / none
- Solutions per page: **1 / 2 / 4 / 6**, only if they fit the trim

**Preview (before generate)**
- Box / border: size, thickness, color
- Numbers: size, color, thickness

**After generate**
- Sudoku grid: **not editable**
- Puzzle number / difficulty text: may stay editable

Then: all / blank / append, Replace, Generate.

---

### Maze panel (session 5 — locked)

**Basic**
- Shape. **Default = Square.** Also: Circle, Hexagon. (Engine already has
  Triangle too — keep it as a fourth existing shape; do not invent a fifth.)
- Difficulty
- How many puzzles
- **No puzzles-per-page**

**Advanced**
- Browse templates (leave, pick another maze template, come back here)
- **Start & finish** — keep
- **Entrance:** top / bottom / left. Owner named those three. The engine
  already has **right** as well — keep all four sides so “left” is not
  a dead-end. Drop `right` only if the owner says so.
- Answers: back / after each / none
- Solutions per page: **1 / 4 / 6 only. Remove 9.**

**Preview (before generate)**
- Maze: **resize, recolor, thickness**

**After generate:** maze walls/path locked.

Then: all / blank / append, Replace, Generate.
Delete placement, safe-area sliders, puzzles-per-page, 9-up answers.

---

### Word search panel (session 5 — Q-06 closed)

**Basic**
- Theme **or** own word list
- Difficulty
- How many puzzles
- No puzzles-per-page

**Advanced**
- Browse templates
- **Word Rules & Modes** — which directions words may run.
  These eight, as already in the panel:

  | Chip | Meaning |
  |---|---|
  | → across | left to right |
  | ↓ down | top to bottom |
  | ↘ diag | down-right |
  | ↗ diag | up-right |
  | ← back | right to left |
  | ↑ up | bottom to top |
  | ↖ diag | up-left |
  | ↙ diag | down-left |

  Difficulty can still pick a default set. User may override by tapping
  chips. At least one direction must stay on.
- **Secret leftover message** — leftover cells spell a message the user types
- Solutions: back / after each / none
- Solutions per page: only counts that fit the trim
- Title
- One shared font (see shared rule)

**Preview**
- Font change shows on the preview (letters **and** title / any number line)
- Letter: color, size, spacing

**After generate:** cannot edit the puzzle.

Remove: KDP safe area, update on all puzzles, placement, puzzles-per-page.
Then: blank / append / all, Replace, Generate.

---

### Crossword panel

**Basic**
- Theme **or** own words + clues
- How many puzzles
- Difficulty

**Advanced**
- Browse templates
- Solutions: back / after each / none
- Solutions per page: **1 / 2 / 4** — **no 6**
- Must be size-sensible
- Title
- What the solver gets: **clues / words / both** — keep, but make
  it practical (no overlap, no black tangle at the edge)

**Known defect (must fix, not a new feature)**
Current crossword answers / words **overlap**. Placement or template
is wrong. A pile of black at the edge. Fix this as part of making
crossword sensible. Users can dump nonsense words — **validate**:
drop junk, require a minimum of real words, fail honestly if the
list cannot build a puzzle.

**Preview**
- Cells: size, thickness, recolor
- Ticks / marks: size, thickness, recolor
- Text font

Remove: "open paint", "blocks", anything not named.
Then: all / blank / append, Replace, Generate.

---

### Handwriting — templates only, not in the generator hub

Owner is unsure. **Simple path (recommended and written as the plan):**

- Handwriting is **not** a generator-hub tool.
- It lives under **Templates**.
- User picks a handwriting template → the book (or the apply target)
  fills in **under a second**.
- Many handwriting templates later.
- No handwriting "advanced generator" for now.
- Matches "not Canva" and "click, book is ready".

If the owner hates this, they will say so. Do not put Handwriting
next to Sudoku in the hub unless they override.

---

## What this replaces from session 1

| Old lock (session 1) | Owner notebook (session 2) |
|---|---|
| Word Search wizard is the launch hero | Home is Create a book + Quick puzzle |
| Wizard finishes in preview, editor is optional | Create a book **goes to the editor** |
| Word Search is the 1-click path | Word Search is **editor only** |
| Quick path = Word Search 6-step wizard | Quick path = Sudoku + Maze, basic only |
| Hide/freeze server in the tree | **Delete** server, Supabase, admin, payments, database |
| CustomerNav Home/Create/Projects/Templates | Wipe current home. Two actions only |

---

## Paper stocks — LOCKED white + cream (session 3–4)

Owner asked: keep all five papers, or only the common ones? App is light,
low-content, not huge novels. Especially unsure about groundwood.

### What paper actually changes in *this* app

Not the puzzle. Not the page color on screen. Not the interior PDF layout.

It changes **three print-shop numbers**:

1. **Cover spine width** — `page count × paper thickness`. Wrong paper →
   Amazon can reject the cover.
2. **Min / max page count** — e.g. colour standard needs 72 pages;
   cream max is 776; white max is 828.
3. **What the user must pick on KDP** when they upload. The PDF itself is
   the same file. Amazon prints it on the stock they choose.

### What each stock is for

| Stock | Who uses it | For this app? |
|---|---|---|
| **White + black ink** | Almost every puzzle / activity / workbook | **Yes. The default.** |
| **Cream + black ink** | Novels, some journals. Warmer, slightly thicker | Optional later if you do lined journals. Rare for Sudoku/mazes |
| **Groundwood** | Cheap high-page paperbacks (newsprint-ish). Not “writing books” | **No.** Confusing. Not a low-content puzzle paper |
| **Colour standard** | Colour interiors. Min 72 pages. Costs more | Only if you sell coloured kids pages. Not v1 |
| **Colour premium** | Photo / picture books | **No.** Not this product |

### Decision

Owner chose **option 2: white + cream**. Default white. No groundwood.
No colour stocks. Paperback / hardcover stays with the cover toggle.

---

## Still waiting from owner

1. Rest of the **editor chrome** (pages list, export, cover inside editor).
2. Exact **most-used trim list** if not the six already listed.
3. What **Quick Generate** does after click.
4. Confirm handwriting = templates only.
5. Confirm Replace + All / Blank / Append as written.
6. Maze entrance: keep **right** as the fourth side? (owner named top/bottom/left)
