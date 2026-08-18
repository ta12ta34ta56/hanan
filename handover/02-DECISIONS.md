# 02 — Locked decisions

These are **closed**. Do not re-open them. Do not ask the owner. Do not
"improve" past them. If a spec contradicts a row here, the spec is wrong.

Decisions were taken from the owner's written context files, the Client UX
Blueprint, the 15-day deadline, and the explicit instruction that many things
are permanently out of scope and the output is very different from the current
app.

---

## D-01 — Product identity

Novelka is a **KDP book producer**, not a graphic-design tool.
Headline promise: idea → configured book → generated pages → validated export.

## D-02 — First experience

The **canvas editor is not the first experience**.
Golden path: Home → Quick Mode wizard → Generate → Spread preview → Preflight → Export.
The editor is an **opt-in inspection / light-edit** workspace.

## D-03 — Launch generator

**Word Search is the launch product.**
Sudoku, Crossword, Maze, Handwriting **already exist** and must not be
rewritten. They may stay reachable as secondary "also available" entries
**only if** they do not steal time from the Word Search golden path.
Do not add new generators. Do not expand their feature lists.

## D-04 — Approach: prune + reshape, not rewrite

Keep working algorithms. Delete or hide out-of-scope surfaces.
Starting the code from zero throws away two months of tested generators
and KDP math. The *output* changes; the *engines* stay.

## D-05 — Guest first

No login required to create, preview, or export a book.
Auth, if present, is optional and must not block the golden path.
`requireEditorAuth` in `App.tsx` is wrong for launch (see BUG-011).

## D-06 — No money in the customer app

No Stripe, no prices, no Upgrade prompt, no ads, no paywalls, no tiers
shown to the user. Existing payment/admin/flag code is out of the
customer product (see `06-DELETE-LIST.md`).

## D-07 — No admin in the customer app

No Admin button, no `gpadmin` unlock in the public app, no OwnerGate,
no admin.novelka.com work. Do not build `requireOwner()` routes.

## D-08 — No server deploy as a launch blocker

The server folder stays in the repo as frozen history.
Do not deploy it. Do not wire entitlement. Do not rotate keys as part of
a coding unit. Local IndexedDB is enough for launch.

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

After Unit 01 (hide/delete out-of-scope customer UI) you do not add
features that are not in `11-15-DAY-PLAN.md`.
