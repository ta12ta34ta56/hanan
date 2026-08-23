# 10 — Contradiction register

These are the landmines that made previous agents guess. Each row names the
winner. Do not re-litigate.

| ID | Conflict | Winner | Loser |
|---|---|---|---|
| C-01 | Book producer vs Canva editor | Producer (D-01, D-02) | `README.md` Phase 1 story |
| C-02 | Wizard-first vs editor-first | Wizard-first (D-02) | `App.tsx` rail as the product |
| C-03 | All 5 generators in scope vs WS-only launch | WS is launch (D-03). Others exist, do not expand. | Blueprint "others planned"; overview "all in scope" for *launch* |
| C-04 | Fresh rewrite vs keep code | Prune + reshape (D-04) | `progress-tracker` open Q1; any "new repo" urge |
| C-05 | Guest-first vs require sign-in | Guest-first (D-05) | `requireEditorAuth`, SETUP.md accounts |
| C-06 | No payments vs deploy Stripe next | No payments (D-06, D-08) | `STATUS.md` §4, SETUP.md, payment docs |
| C-07 | No admin vs build requireOwner next | No admin (D-07) | STATUS 3.2, admin SPA, ADMIN-API-CONTRACT |
| C-08 | Fixed trims vs custom sizes | D-09 list | custom cards, 7×9 in Blueprint, extra presets in picker |
| C-09 | No free-form design vs 129 stickers + shapes | D-10 | Elements rail, ShapePanel, asset library as a feature |
| C-10 | Light-first vs dark-default | Light-first (D-18) | STATUS.md theme paragraph |
| C-11 | Cover = isolated light surface vs full designer | D-11 | Cover as a Canva page |
| C-12 | Server is authority vs local-only launch | Local-only for launch (D-08) | Server-authority blueprint as a launch task |
| C-13 | "649 tests all passing" vs prune will break admin tests | Launch verification set (14-VERIFICATION) | Blind `npm run check` as the only gate |
| C-14 | context/progress-tracker still "decision lock" | Decisions locked here (02) | That file's Open Questions |
| C-15 | Blueprint 5 trims including 7×9 vs architecture "KDP only" | D-09 | Blueprint §Format |
| C-16 | README "not in this phase: auth, stripe, modules" vs modules exist | Modules exist; auth/stripe out | Stale README "Not in this phase" |
| C-17 | README storage localStorage vs IndexedDB | IndexedDB (`storage.ts`) | Stale README paragraph |
| C-18 | Duplicate `/docs` vs `novelka/docs` | Treat as archive. Handover wins. | Editing either as if current |
| C-19 | ui-context "no drag-and-drop" vs layers reorder | Reorder pages/layers OK (D-10) | Removing grab-reorder |
| C-20 | "Output is very different" vs keep engines | Different UX/output files; same engines (D-04) | Greenfield rewrite |
| C-21 | Session-1 WS wizard-first vs owner home | Owner notebook: Create a book + Quick Sudoku/Maze | `CLIENT-UX-BLUEPRINT`, old D-02/D-03 |
| C-22 | Freeze server vs delete server | Owner: delete completely | Session-1 D-08 freeze |
| C-23 | Editor optional vs Create a book opens editor | Owner: Create a book goes to the editor | Session-1 D-02 |

When you find a new contradiction: add a row, pick the winner using
`01-AUTHORITY.md`, and if you had to assume, mark `ASSUMED` in the tracker.
