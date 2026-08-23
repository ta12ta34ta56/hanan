# 14 — Verification

A unit is not done because the code "looks right".

## Launch verification set (use this, not blind `npm run check`)

From `novelka/`:

```bash
npm run lint
npx tsc -b
npm run test:wordsearch
npm run test:quick-flow
npm run test:kdp
npm run test:cover-guides
npm run test:preflight
npm run test:engine
npm run test:project-flow
npm run test:nav-flow
npm run test:preview-flow
npm run build
```

Add module suites only if you touched that module:

```bash
npm run test:sudoku
npm run test:crossword
npm run test:maze
npm run test:handwriting
npm run test:templates
npm run test:live
```

## Do not require these for launch

They protect surfaces we are removing or freezing:

- `npm run test:flags`
- `npm run test:admin`
- `npm run test:admin-ui`
- `npm run test:auth` / `test:auth` supabase
- `npm run test:server`
- `npm run test:rls`
- `npm run test:staging-smoke`

If you delete a customer surface, delete or skip the test that asserted the
old surface existed. Do not keep a test that forces UpgradePrompt to render.

`npm run check` currently chains lint → tsc → **all** unit suites including
server and admin. After Unit 01 it may fail for the right reason. That is
not a regression of the golden path.

## Manual golden-path script (every unit from 02 onward)

1. `npm run dev`
2. No account. No console errors on load.
3. Home shows one primary CTA: create a Word Search book.
4. Wizard: title, one theme, 6×9, 10 puzzles (faster than 25 for the check),
   back-of-book answers, Classic.
5. Generate finishes. Progress is visible.
6. Preview opens (spreads). Pages look like a book, not a cover-sized strip.
7. Preflight is visible and not a lie.
8. Export downloads interior PDF. If cover exists, a second cover PDF.
9. Reload the app. Project is in Projects. It reopens.
10. Still no Upgrade / Admin / login wall.

## Invariant spot-checks

- Cover guides are not in the PDF and not in thumbnails.
- Interior PDF does not contain the cover page.
- Page size of interior == chosen trim (points: 6×9 = 432×648).
- No custom width/height field exists in the UI.
- Guest can do all of the above.

## Definition of launch-ready

- Units 01–04 done
- Launch verification set green (or failures explained as deleted-surface tests)
- Manual script passes twice in a row
- Tracker status = `LAUNCH-READY` or `LAUNCH-WITH-GAPS` with gaps listed
