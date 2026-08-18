# 02 — Locked decisions

These are **closed** unless the owner notebook (`16-OWNER-NOTEBOOK.md`)
overrides them. The owner notebook from session 2 **did** override several
session-1 locks. Those rows are marked SUPERSEDED.

Do not invent past the notebook. If the notebook has not named it, wait.

---

## D-01 — Product identity

Novelka is a **KDP book producer**, not a graphic-design tool.
Headline promise: idea → configured book → generated pages → validated export.

## D-02 — First experience  **SUPERSEDED by owner notebook 2026-08-18**

~~Wizard-first, editor optional.~~

**Now:** Home has two actions only.

- **Create a book** → setup window → **editor**
- **Quick puzzle making** → basic Sudoku or Maze generate

The current homepage is wiped. Word Search is not the first-click path.

## D-03 — Who is quick vs who is editor  **SUPERSEDED**

~~Word Search is the launch hero.~~

**Now (owner notebook):**

- Quick window: **Sudoku** and **Maze** only. Basic inputs. No advanced.
- **Word search, crossword, handwriting** → user must open the editor.
- Do not add new generators. Do not rewrite existing generator algorithms.

## D-04 — Approach: prune + reshape, not rewrite

Keep working algorithms. Delete or hide out-of-scope surfaces.
Starting the code from zero throws away two months of tested generators
and KDP math. The *output* changes; the *engines* stay.

## D-05 — Guest first

No login required to create, preview, or export a book.
Auth, if present, is optional and must not block the golden path.
`requireEditorAuth` in `App.tsx` is wrong for launch (see BUG-011).

## D-06 — No money

No Stripe, no prices, no Upgrade, no ads, no paywalls, no subscriptions.
**Delete** the payment code. Do not leave it frozen.

## D-07 — No admin

**Delete** admin SPA, AdminPanel, OwnerGate, admin-access, admin.html.
Do not build admin.novelka.com.

## D-08 — No server, no Supabase, no database  **STRENGTHENED**

~~Freeze the server folder.~~

**Delete completely:** `novelka/server/**`, Supabase client, auth adapter,
env keys, entitlement, GDPR server routes, ratings-to-server.
In scope = **client app + engines only**.
Local IndexedDB is the only storage.

## D-09 — Fixed trims only

Launch trim list (no custom width/height, no free-form size):

| id | Size | Role |
|---|---|---|
| `kdp6x9` | 6 × 9 in | **Default.** Most KDP paperbacks |
| `kdp85x11` | 8.5 × 11 in | Workbooks / large print |
| `kdp8x10` | 8 × 10 in | Activity books |
| `kdp7x10` | 7 × 10 in | Puzzle books |
| `kdp55x85` | 5.5 × 8.5 in | Smaller journals |
| `A4` | 210 × 297 mm | International |

Drop from the **picker** (files may keep the data): `kdp5x8`, `kdp825x6`,
`kdp825x825`, `A5`, `letter`, `legal`, `square`, and every custom-size input.
`CUSTOM_TRIM_LIMITS` and any custom size card are deleted from the UI.

Do **not** add the Blueprint's `7 × 9` — it is not in this locked list.

## D-10 — No free-form design as a feature

Do not sell or lead with drag-and-drop canvas assembly, sticker palettes,
shape toolboxes, or "design anything".
Allowed: select / move / resize / recolor **existing** elements; reorder
pages and layers; undo/redo.

## D-11 — Cover

One isolated flat wraparound cover (back + spine + front + bleed).
Phantom DOM guides only (bleed / spine / safe / barcode).
Spine math stays in `kdp-cover.ts` — never rewrite.
v1 cover editing = title / author / background color + those guides.
Not a full cover designer.

## D-12 — Interior vs cover

Cover is `role: 'cover'`. Interior apply-to-all, interior templates, and
interior export never touch it. Export always offers separate files.

## D-13 — Guides are never document content

Bleed / gutter / safe / spine / barcode overlays are DOM-only.
Never written into `page.data`, never selected, never in thumbnails,
never in the PDF.

## D-14 — Generated pages use the book's trim

Never cover size. Never a hardcoded 6×9 if the book is another trim.
`kind` tag is the only way "apply to all" decides what to touch.

## D-15 — Fonts are real

No synthetic bold/italic. `font-synthesis: none`. Real files only.

## D-16 — No dead controls

If a slider, chip, or toggle is visible, it must change the book.
Otherwise delete it.

## D-17 — Desktop first

Laptop/desktop is the target. Responsive is fine. Not a mobile-first app.
Do not build a native app.

## D-18 — Theme

Follow `context/ui-context.md`: **light-first**, canvas paper always white.
Ignore STATUS.md's "dark by default".

## D-19 — Storage

Local IndexedDB. Honest failure (`StorageFullError`). Autosave must warn.
No cloud sync for launch.

## D-20 — Honest copy

Never "100% Amazon guaranteed".
Say "Novelka Preflight: Passed" / "Warnings need review".

## D-21 — Do not rewrite these

- `src/services/kdp-cover.ts`
- `src/services/kdp.ts` (reuse; do not invent new margin math)
- `src/modules/*/generator.ts` algorithms
- Design tokens in `src/index.css` (add a token if needed; do not repaint)

## D-22 — Two serialization allow-lists

Any new custom object property must be added to **both**:
- `CanvasEngine.EXTRA_PROPS`
- `PUZZLE_EXTRA_PROPS` in `modules/shared/puzzle-utils.ts`

Missing either silently drops tags. This has already broken live-adjust
in every module. See BUG-001.

## D-23 — Tests before "done"

A unit is not done until the relevant tests pass and `npm run build` passes.
Do not disable tests to make a delete look clean — remove the tests that
existed only to protect deleted customer surfaces (admin/payments/flags UI).

## D-24 — Documentation after a unit

Update `12-PROCESS-TRACKER.md` after every meaningful change.
Append `15-SESSION-LOG.md`.
If you change a decision, you are wrong — decisions are locked.

## D-25 — Owner is unavailable

Work from this folder. Do not wait. Do not ping. If truly blocked, pick
the smaller option that still ships D-02's golden path, record the choice
in the tracker as `ASSUMED` with the date, and continue.

## D-26 — Scope freeze after Day 1 inventory

After Unit 01 you do not add features that are not in the owner notebook
or `11-15-DAY-PLAN.md`.

## D-27 — Not Canva, ever

The app must not look, act, or market like Canva. No sticker/shape
design identity. It is a low-content book click-to-publish tool for
individuals.

## D-28 — Create-a-book window fields

Exact order: Title (default `New Book`) → Paper (**white or cream only**,
default white) → Cover on by default, then Paperback/Hardcover →
standard trim → page count → Create → editor.
No groundwood. No colour paper. No other fields.

## D-29 — Quick puzzle is basic only

Sudoku quick: trim, 4×4|9×9|16×16, difficulty, count, Generate.
Maze quick: trim + basic inputs the owner names (not named yet).
No advanced settings in the quick window.

## D-30 — Do not implement while the notebook is incomplete

Do not build until the owner says the notebook is enough.
Do not invent maze fields, word-search "modes", or leftover editor chrome.

## D-31 — Two template kinds

Page templates (lines/journal/handwriting): preview → optional line
color → apply.
Puzzle templates (sudoku/maze/ws/crossword): temporary canvas preview +
left generator panel → Generate → puzzle content locked.

## D-32 — Template pairs and variants

Pair badge = left/right matched pages (verso/recto). Variant mark =
siblings (thin/wide/bold) behind one gallery card.
Do not invent pair artwork.

## D-33 — Generator panel shape

Basic first, Advanced folded. No puzzles-per-page. No placement. No
safe-area sliders. No 9-up maze solutions. Crossword solutions 1/2/4
only. Auto-add pages if the book is too short. Delete anything the
owner did not name.

## D-34 — Handwriting is templates, not a hub generator

Unless the owner overrides. Pick a handwriting template, book fills.
