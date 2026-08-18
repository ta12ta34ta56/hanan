# 11 — 15-day plan (2026-08-18 → 2026-09-01)

College starts in 15 days. This is the only plan. Do not invent Phase 8.

One unit at a time. A day may finish more than one small unit or one big unit.
If you slip, **cut from the bottom**, never from Units 01–04.

```
MUST   01–04   delete non-engine + new home + create-book + quick sudoku/maze
WAIT   editor  do not build the editor until the owner sends that notebook page
SHOULD 05–07   storage honesty, cover, slim editor
NICE   08–10   secondary generators, polish, docs pointers
BUFFER 11–15   harden, fix regressions, stop adding
```

---

## Unit 01 — Delete everything that is not the engine (Day 1–2)

**Goal:** Client book app only. Supabase, server, admin, payments, ads, flags
as a product — **gone from the tree**, not hidden.

**Do:**
- Delete `novelka/server/**`, `src/admin/**`, admin.html, OwnerGate, AdminPanel,
  payments, UpgradePrompt, supabase dependency and auth adapter, admin-access.
- Remove `requireEditorAuth`.
- Trim pickers: no custom size.

**Do not:** rewrite generators or KDP math. Do not rebuild the editor yet.

**Verify:**
- Search customer UI copy for Upgrade, Pro, Enterprise, Admin, Stripe, Ad, Watch an ad.
- Create a book with no account.
- `npm run lint` + `tsc -b` on what you touched.
- Launch test set still meaningful (skip admin/flags if you removed those surfaces).

**Tracker:** mark ISS-004, ISS-005, ISS-011, ISS-019 in progress → done.

---

## Unit 02 — New home (Day 2–3)

**Goal:** Wipe current home. Two actions only.

**Do:**
- **Create a book** button → window: Title (`New Book`) → Paper & binding
  (five cover-creator stocks) → Cover ON + Paperback/Hardcover → standard
  trim → page count → Create → **editor**.
- **Quick puzzle making** beside it → Sudoku (trim, 4×4/9×9/16×16,
  difficulty, count, Generate) and Maze (trim + basic inputs owner names).
- Word search / crossword / handwriting are **not** in the quick window.

**Do not:** invent maze fields or post-generate destination. Do not build
the editor chrome. Do not put Word Search on the home quick path.

**Blocked on:** owner editor notes; maze field list; what Generate does next.

---

## Unit 03 — Honest book geometry (Day 4–5)

**Goal:** Every create path stamps the chosen trim. No hardcoded size.
No custom size leftover.

**Do:**
- Audit New Book, wizard, cover-only, "create from template".
- BUG-025, BUG-030, ISS-009.
- Generated pages built at interior trim (invariant 4).

**Verify:** `npm run test:kdp` `npm run test:wordsearch`
Generate at 6×9 and 8.5×11; page width/height match.

---

## Unit 04 — Preview, preflight, export (Day 5–7)

**Goal:** The launch promise completes.

**Do:**
- Preview spreads work for the generated book.
- Preflight visible, honest (BUG-023, D-20).
- Export defaults: Interior PDF + Cover PDF (if cover exists).
- No paywall watermark. No quota modal.
- Collapse designer options (ISS-018).

**Verify:** `npm run test:preview-flow` `npm run test:preflight`
Open the two PDFs: interior page count and size; cover is one wraparound page.
`npm run build`

**This is the launchable product.** Everything after this is hardening.

---

## Unit 05 — Storage and crash safety (Day 7–8)

**Do:**
- Autosave warn still works (BUG-012).
- Projects view: open / preview / export / delete / duplicate if it already exists.
- ErrorBoundary still offers Download my work.
- Soft warning if generate is about to create a huge book (BUG-026, BUG-029).

**Verify:** `npm run test:project-flow`
Fill storage or mock failure; UI tells the truth.

---

## Unit 06 — Cover, light (Day 8–9)

**Do:**
- Optional cover from wizard / book settings.
- Isolated role. Phantom guides only.
- Title / author / background. No sticker cover designer.
- Interior export never includes cover (BUG-024).

**Do not:** rewrite `kdp-cover.ts`.

**Verify:** `npm run test:cover-guides`
Export pair; cover width = back + spine + front + bleed.

---

## Unit 07 — Slim the editor (Day 9–11)

**Do:**
- Editor is inspect/tweak: pages, layers, select/move/resize/recolor, undo.
- No Elements/Uploads/Shapes as primary tools (if any survived Unit 01).
- Keep generator panel only if needed for "regenerate / live style".
- Dead controls deleted (D-16).

**Do not:** rebuild CanvasEngine.

**Verify:** generate → open editor → change a title color → export still works.

---

## Unit 08 — Secondary generators or hide them (Day 11–12)

**Only if Units 01–04 are green.**

- If Sudoku/Crossword/Maze/Handwriting can be reached without new work and
  do not crash the golden path, list them under Create as "Also available".
- If they pull you into bugs, **hide the cards**. Hiding is success.

**Do not:** add features from their NOTES "not done yet" lists.

---

## Unit 09 — Polish (Day 12–13)

- Light-first default (ISS-006).
- Empty states, honest errors, a11y names on launch-path buttons.
- `npm run test:a11y` if it still applies.
- No console errors on the golden path.

---

## Unit 10 — Docs pointers + freeze (Day 13–14)

- 10-line banner at top of `novelka/README.md` and `STATUS.md`:
  "Launch work is directed by `/handover`. Do not follow §Next task here."
- Update `12-PROCESS-TRACKER.md` to `LAUNCH-READY` or `LAUNCH-WITH-GAPS`.
- Stop adding features.

---

## Days 14–15 — Buffer

Only: fix regressions on the golden path. Run the launch verification set.
Prepare a short owner demo script (in the session log):

1. Open app
2. Create Word Search book
3. Generate
4. Preview
5. Export two PDFs

If a day is lost, drop Units 08 then 09 then 07 then 06.
**Never drop 01–04.**

---

## Explicitly not in these 15 days

- Stripe, Supabase deploy, Cloudflare, key rotation
- Admin API, admin.novelka.com
- New generators, snake WS, American crossword
- Marketplace, ads, mobile app, AI
- Rewriting Fabric/engine
- Deduping `/docs` vs `novelka/docs` (unless you have leftover hours)
