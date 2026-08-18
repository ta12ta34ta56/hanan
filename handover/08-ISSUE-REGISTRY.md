# 08 — Issue registry

Issues are **product / architecture / process** problems, not necessarily
runtime bugs. Bugs live in `09-BUG-REGISTRY.md`.

**Status:** `open` · `in-progress` · `done` · `wontfix` · `deferred`
**Launch:** `blocker` · `should` · `later` · `out-of-scope`
**Tags:** see `tags.md`

How to add one: copy `templates/ISSUE.md`, give the next ISS-xxx id, add a
row here.

---

## Index

| ID | Title | Launch | Status | Tags |
|---|---|---|---|---|
| ISS-001 | Two products in one repo | blocker | open | area:ux type:contradiction |
| ISS-002 | Canvas is still the center of gravity | blocker | open | area:ux type:debt |
| ISS-003 | Customer UI still sells Canva tools | blocker | open | area:ux type:bloat |
| ISS-004 | Payments / flags / ads still wired | blocker | done | area:payments type:delete |
| ISS-005 | Admin lives inside the customer app | blocker | done | area:admin type:delete |
| ISS-006 | Theme default conflict (light vs dark) | should | open | area:ux type:contradiction |
| ISS-007 | README / STATUS describe the old product | should | open | area:docs type:contradiction |
| ISS-008 | Duplicate `/docs` and `novelka/docs` | later | open | area:docs type:debt |
| ISS-009 | Custom sizes still offered | blocker | done | area:kdp type:delete |
| ISS-010 | God files (App, engine, inspector) | later | open | area:editor type:debt |
| ISS-011 | Auth blocks guests when Supabase is configured | blocker | done | area:auth type:bug |
| ISS-012 | Entitlement is fake security | out-of-scope | deferred | area:auth type:debt |
| ISS-013 | Server not deployed (old "next task") | out-of-scope | wontfix | area:payments type:delete |
| ISS-014 | Docs authority was undefined | blocker | done | area:docs type:process |
| ISS-015 | Open questions in context/progress-tracker | blocker | done | area:docs type:process |
| ISS-016 | Launch path is Word Search, other gens distract | should | open | area:ux type:bloat |
| ISS-017 | Cover UX is a full wizard, v1 needs less | should | open | area:ux type:bloat |
| ISS-018 | Export dialog has too many designer options | should | open | area:export type:bloat |
| ISS-019 | Watermark / quota UX for a free launch | blocker | done | area:export type:delete |
| ISS-020 | Same-page-bottom answers never built | later | deferred | area:generator type:debt |
| ISS-021 | Template chrome not re-laid on resize | later | deferred | area:generator type:debt |
| ISS-022 | 15-day plan did not exist | blocker | done | area:docs type:process |
| ISS-023 | Agent had no memory / tracker | blocker | done | area:docs type:process |
| ISS-024 | Test suite couples product to admin/payments | should | open | area:docs type:debt |
| ISS-025 | Home still offers "open module in editor" | should | open | area:ux type:debt |
| ISS-026 | New Book modal vs Quick Wizard duplication | should | open | area:ux type:debt |
| ISS-027 | Ratings / social / help clutter | later | open | area:ux type:bloat |
| ISS-028 | Bundle weight (pdfjs, supabase, fabric, assets) | should | open | area:perf type:bloat |
| ISS-029 | No single "next action" for a new agent | blocker | done | area:docs type:process |
| ISS-030 | Owner unavailable — decisions must be locked | blocker | done | area:docs type:process |
| ISS-031 | Wipe current homepage; two buttons only | blocker | open | area:ux type:delete |
| ISS-032 | Delete server/Supabase/admin/payments for real | blocker | open | area:docs type:delete |
| ISS-033 | Create-a-book window = cover paper list + editor | blocker | open | area:ux |
| ISS-034 | Quick puzzle = Sudoku + Maze only, basic | blocker | open | area:ux |
| ISS-035 | Session-1 WS-wizard plan conflicts with owner notebook | blocker | done | area:docs type:contradiction |
| ISS-036 | Editor not specified yet | blocker | open | area:editor type:process |

---

## Details

### ISS-001 — Two products in one repo
The tree contains a Canva editor **and** a book-producer wizard.
`README.md` / `STATUS.md` sell the editor. `context/` + Client UX Blueprint
sell the producer. Agents follow whichever file they open first.
**Fix:** this folder is now the authority (ISS-014). Then Unit 01/02 make
the running app match.

### ISS-002 — Canvas is still the center of gravity
`App.tsx` default editor is a full design surface (rail, inspector, docks).
Golden path must end in preview/export, not a blank canvas.
**Fix:** Unit 02 — wizard completes into preview; editor is a button.

### ISS-003 — Customer UI still sells Canva tools
Rail: Templates, Generators, Text, Elements, Uploads.
**Fix:** Unit 01 remove Elements/Uploads from rail. Later, slim the editor
to pages / layers / light properties.

### ISS-004 — Payments / flags / ads still wired
`feature-flags.ts` (609 lines), `payments.ts`, `UpgradePrompt`, flag-store
init in App boot.
**Fix:** Unit 01 stop calling them from the customer path.

### ISS-005 — Admin lives inside the customer app
Hidden key-sequence admin + separate `src/admin` SPA.
**Fix:** Unit 01 disconnect. Do not build server admin.

### ISS-006 — Theme default conflict
`STATUS.md`: dark by default. `ui-context.md`: light-first.
**Fix:** D-18 light-first. Align `theme-store` default in the polish unit.

### ISS-007 — README / STATUS describe the old product
A future human (or agent) will follow them.
**Fix:** After launch path works, add a 10-line pointer at the top of
`novelka/README.md` and `STATUS.md` to `handover/`. Do not rewrite those
files in Unit 01.

### ISS-008 — Duplicate docs trees
`/docs` and `novelka/docs` are copies. Drift is guaranteed.
**Fix:** later. Do not spend launch days on it.

### ISS-009 — Custom sizes still offered
`book.ts` `CUSTOM_TRIM_LIMITS`, canvas types extras, New Book custom card.
**Fix:** Unit 01/03 — picker = D-09 list only.

### ISS-010 — God files
App 778, engine 1446, inspector 967, templates 1239.
**Fix:** extract only when a unit must touch that slice.

### ISS-011 — Auth blocks guests
See BUG-011. Decision D-05.

### ISS-012 — Entitlement is fake security
Documented everywhere. Launch has no entitlement. Deferred forever for v1.

### ISS-013 — "Next task is deploy"
STATUS §4. **wontfix for launch.** Owner can deploy later. Not your job.

### ISS-014 / ISS-015 / ISS-022 / ISS-023 / ISS-029 / ISS-030
Solved by this folder.

### ISS-016 — Other generators distract
They work. Launch is Word Search. Home should not push all five equally.
**Fix:** Unit 02 — Word Search is the hero. Others: "Also available" or
hidden behind Create if time is short.

### ISS-017 — Cover UX too deep
CoverWizard is a designer. D-11: title/author/background + guides.
**Fix:** Unit 06. Do not rewrite `kdp-cover.ts`.

### ISS-018 — Export dialog too designer-y
DPI, ranges, watermark, formats.
**Fix:** Unit 04 — default: Interior PDF + Cover PDF. Advanced collapsed.

### ISS-019 — Watermark / quota for a free launch
Free-plan watermark and 5/day are paywall leftovers.
**Fix:** Unit 01/04 — launch exports have no paywall watermark and no
client quota nag.

### ISS-020 / ISS-021
Known generator debts. Deferred. Do not implement.

### ISS-024 — Tests couple to admin/payments
`test:admin`, `test:admin-ui`, `test:flags`, `test:auth`, staging-smoke.
When you remove customer surfaces, those tests will fail or become lies.
**Fix:** stop calling them from the launch verification set
(`14-VERIFICATION.md`). Delete or skip only the tests whose surface is gone.

### ISS-025 — Home "open module in editor"
`onOpenModuleInEditor` opens New Book then the generator panel — old path.
**Fix:** Unit 02 — module cards start the matching wizard, or are secondary.

### ISS-026 — New Book modal vs Quick Wizard
Two setup flows. Users get lost.
**Fix:** Word Search uses the wizard only. New Book is for "empty book /
other generators" if those stay.

### ISS-027 — Ratings / social / help clutter
Not blockers. Hide nags first (DEL-11).

### ISS-028 — Bundle weight
pdfjs and supabase already lazy. Stickers/assets and admin chunks should
not load on the golden path. After Unit 01, confirm admin/payments are not
in the main graph.
