# 06 — Permanently out of scope / delete from the customer product

"Delete" means: **the customer cannot see it, click it, or depend on it.**

How you delete depends on the unit. Preferred order:

1. **Remove from the customer UI first** (rail, nav, modals, CTAs, copy).
2. Then delete or stop importing the code if nothing else references it.
3. Delete tests that exist only to protect the removed customer surface.
4. Do **not** spend a day hunting every unused helper if the UI is already gone.

Do **not** delete generator algorithms, KDP math, storage, or the Word Search
wizard.

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

## P2 — do not work on (frozen, not a coding task)

| ID | What | Where | Action |
|---|---|---|---|
| DEL-20 | Admin SPA | `src/admin/**`, `admin.html`, `admin-main.tsx` | Do not develop. Do not wire to production. |
| DEL-21 | Server / Stripe / GDPR / entitlement | `novelka/server/**` | Frozen. Do not deploy. Do not extend. |
| DEL-22 | Marketplace / template publication ops | admin template lifecycle, `docs/ADMIN-API-CONTRACT.md` | Out of scope. |
| DEL-23 | Ads network | any ad-unlock route | Permanently out. |
| DEL-24 | Collaborative editing | — | Permanently out. |
| DEL-25 | Mobile-native app | — | Permanently out. |
| DEL-26 | AI-generated puzzle content | — | Permanently out. |
| DEL-27 | Dense American crossword engine | crossword NOTES | Permanently out. |
| DEL-28 | Snake / bending word search | word-search NOTES | Permanently out. |
| DEL-29 | Custom 7×9 trim from the Blueprint | `CLIENT-UX-BLUEPRINT.md` | Rejected by D-09. |
| DEL-30 | Cloud project sync | — | Permanently out for launch. |

## What you must NOT delete

- `modules/**/generator.ts` and their tests
- `services/kdp.ts`, `services/kdp-cover.ts`, `cover-guides.ts`
- `domain/quick-word-search.ts`, `domain/preflight.ts`, `domain/word-search-solver.ts`
- `engine/pdf-export.ts`, `engine/canvas-engine.ts` (prune calls, don't trash)
- `services/storage.ts`
- `QuickWordSearchWizard.tsx`, CustomerNav, Home / Projects views
- IndexedDB migration / legacy key fallbacks

## Definition of "customer-clean"

A stranger opening the app can **not** find:

- the word Upgrade, Pro, Enterprise, Stripe, Ad, Admin
- a custom width/height field
- a sticker/shape toolbox as a primary tool
- a login wall before making a book

Search the customer bundle / UI copy for those strings before you mark
Unit 01 done.
