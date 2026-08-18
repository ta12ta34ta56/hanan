# 06 — Permanently out of scope / delete from the customer product

Owner 2026-08-18: **delete completely.** Not hide. Not freeze.

If it is not the client app engine (generators, KDP math, the editor the
owner describes, local storage, PDF export), it leaves this repo.

Do **not** delete generator algorithms or `kdp.ts` / `kdp-cover.ts`.

---

## P0 — must vanish from the customer UI in Unit 01

| ID | What | Where | Action |
|---|---|---|---|
| DEL-01 | Upgrade / paywall | `UpgradePrompt.tsx`, any "Upgrade" / "Pro" / "Watch an ad" copy | Remove from UI. Stop importing. |
| DEL-02 | Stripe / payments customer flow | `services/payments.ts` call sites, checkout buttons | No customer calls. File may remain unreferenced. |
| DEL-03 | Hidden admin unlock | `admin-access.ts`, `watchForUnlock`, `gpadmin`, `#gp-control`, `__gpControl` | Remove from `App.tsx`. Public build must not fetch AdminPanel. |
| DEL-04 | Admin modal + owner gate | `modals/AdminPanel.tsx`, `OwnerGate.tsx` | Unreachable from App. |
| DEL-05 | Feature-flag / tier chrome | `flag-store` UI, AD/PRO badges that block actions, daily-limit upgrade | Customer path ignores flags. Everything offered is free. |
| DEL-06 | Forced sign-in | `requireEditorAuth` in `App.tsx` | Delete the gate. Guest can create / open / export. |
| DEL-07 | Custom trim input | New Book / wizard custom size, `CUSTOM_TRIM_LIMITS` UI | Remove the control. |
| DEL-08 | Canva "Elements" rail item | RAIL entry `elements`, `ElementsPanel` | Remove from rail. |
| DEL-09 | Uploads-as-design-tool rail | RAIL entry `uploads` as a headline tool | Remove from rail. (Editor may still allow replacing an existing image later.) |
| DEL-10 | PDF import as a create path | CreateView `onImportPdf`, More menu "Import PDF" | Remove from Home/Create/More. |
| DEL-11 | Rating nags | `RatingModal` auto-open on export / leaving editor | Stop auto-prompting. Optional: delete the modal. |
| DEL-12 | Money copy | Any "$4.99", "Enterprise", "ad unlock", "watermark for free users" in customer UI | Delete the strings. Launch exports are clean (no paywall watermark). |

## P1 — remove after the golden path is solid (Units 03–05)

| ID | What | Where | Action |
|---|---|---|---|
| DEL-13 | Shape toolbox | `ShapePanel.tsx` | Not a launch surface. |
| DEL-14 | Sticker / asset library as a product | `asset-library.ts`, `public/assets/stickers` etc. | Do not feature. Do not add assets. Safe to leave files on disk. |
| DEL-15 | 14 rulings as a design product | `rulings.ts`, `LinesPanel` | Not the launch path. Hide. |
| DEL-16 | Generic 20-template "master pages" as Canva | `TemplatePanel` / library used as a blank-page designer | Wizard + parametric WS templates stay. Blank-journal template browsing is secondary. |
| DEL-17 | Auth modal as a blocker | `AuthModal.tsx` | May remain unused. No "Sign in" required on the top bar for launch. A quiet optional account is fine if it takes <30 minutes; otherwise hide the button. |
| DEL-18 | Social links footer | `social-links.ts` | Hide empty placeholders. Not launch-critical. |
| DEL-19 | Extra trims in pickers | see D-09 | Offer only the six locked trims. |

## P0b — delete the whole non-engine stack (owner: completely)

| ID | What | Where | Action |
|---|---|---|---|
| DEL-20 | Admin SPA | `src/admin/**`, `admin.html`, `admin-main.tsx` | **Delete the files** |
| DEL-21 | Server package | `novelka/server/**` | **Delete the folder** |
| DEL-31 | Supabase | `@supabase/supabase-js`, `auth.ts` supabase adapter, `.env` supabase keys, tests | **Delete** |
| DEL-32 | Duplicate root docs that are payments/admin/server | `/docs` payment/admin/server/beta files | Delete or stop treating as current |
| DEL-22 | Marketplace / template publication ops | admin template lifecycle | Out. Delete with admin. |
| DEL-23 | Ads network | ad-unlock | Delete |
| DEL-24 | Collaborative editing | — | Out |
| DEL-25 | Mobile-native app | — | Out |
| DEL-26 | AI-generated puzzle content | — | Out |
| DEL-27 | Dense American crossword engine | crossword NOTES | Out |
| DEL-28 | Snake / bending word search | word-search NOTES | Out |
| DEL-29 | Custom 7×9 / any custom size | Blueprint, `CUSTOM_TRIM_LIMITS` | Delete from UI and model pickers |
| DEL-30 | Cloud project sync | — | Out |
| DEL-33 | Current homepage content | Home/Create/Projects/Templates as they are now | **Wipe.** Replace with two buttons only. |
| DEL-34 | Word Search as a home quick-wizard | `QuickWordSearchWizard` as the hero | Not the home quick path. WS is editor-only. |

## What you must NOT delete

- `modules/**/generator.ts` and their tests
- `services/kdp.ts`, `services/kdp-cover.ts`, `cover-guides.ts`
- `domain/quick-word-search.ts`, `domain/preflight.ts`, `domain/word-search-solver.ts`
- `engine/pdf-export.ts`, `engine/canvas-engine.ts` (prune calls, don't trash)
- `services/storage.ts`
- IndexedDB migration / legacy key fallbacks
- Paper stock list in `kdp-cover.ts` (Create a book reuses it)

`QuickWordSearchWizard` is **not** the home hero anymore (DEL-34). Do not
treat the current Home/Create/Projects/Templates IA as sacred.

## Definition of "customer-clean"

A stranger opening the app can **not** find:

- the word Upgrade, Pro, Enterprise, Stripe, Ad, Admin
- a custom width/height field
- a sticker/shape toolbox as a primary tool
- a login wall before making a book

Search the customer bundle / UI copy for those strings before you mark
Unit 01 done.
