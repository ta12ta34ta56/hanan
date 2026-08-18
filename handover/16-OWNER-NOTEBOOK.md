# 16 — Owner notebook (highest product authority)

**This file is the owner's words, organized.**
It beats every earlier decision in this folder, including the 2026-08-18
Word-Search-wizard plan.

- Status: **INCOMPLETE** — homepage + out-of-scope recorded. **Editor not
  received yet.**
- Do not invent the missing editor. Wait for the next owner message.
- Do not implement until the owner finishes talking, unless they say "build".

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
2. **Paper & binding**
   - Bring the same list that already exists on the cover creator.
   - Options (already in `kdp-cover.ts` `PAPER_STOCKS`):

   | id | Label | Note |
   |---|---|---|
   | `white` | Black ink, white paper | Most common |
   | `cream` | Black ink, cream paper | Novels, journals |
   | `groundwood` | Black ink, groundwood paper | Economy paper |
   | `color-standard` | Colour, standard paper | Colour interior |
   | `color-premium` | Colour, premium paper | Photo books |

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
| **Maze** | Yes | Trim + basic inputs + Generate (owner did not list maze fields yet) |
| **Word search** | No | Must open the editor |
| **Crossword** | No | Must open the editor |
| **Handwriting** | No | Must open the editor |

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
- "Basic input" — **not listed yet**. Do not invent. Wait or ask only this.

---

## Editor

**Not received.** Owner asked whether to send it now or later.
This file will get an Editor section when they send it.

Do not design the editor from old Canva rails while waiting.

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

## Paper stocks — owner is unsure (2026-08-18 session 3)

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

### Agent recommendation (not locked)

**v1: one paper. White + black ink. Do not show a paper picker.**
Tell the user (one quiet line): *Print as black ink on white paper on KDP.*

Keep paperback / hardcover — that one *does* change the cover a lot.

Add cream or colour later if the owner wants journals or coloured kids books.

**Why not “keep all five, math is done”:** math is already written. The
problem is a beginner picking groundwood or colour by accident and getting
a rejected cover. Light app = fewer ways to get that wrong.

Owner must say yes/no before Create-a-book is built.

---

## Still waiting from owner

1. The **editor** (they said there is a lot more).
2. Exact **maze** quick fields.
3. Exact **most-used trim list** if it is not the six already locked
   (6×9, 8.5×11, 8×10, 7×10, 5.5×8.5, A4).
4. What Quick Generate does after click (land in editor? download? preview?).
   Not named. **Do not assume.** Wait.
