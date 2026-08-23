# 01 — Authority (which document wins)

The repo contains **conflicting products**. Different files describe different
apps. A previous agent that "just reads the repo" will guess wrong.

## Order of authority (highest first)

1. **The owner's latest notebook message** — written into
   `handover/16-OWNER-NOTEBOOK.md`. This is more accurate than any earlier
   plan. If the owner and an older handover file disagree, the notebook wins.
2. **`handover/16-OWNER-NOTEBOOK.md`** — organized owner instructions
3. **`handover/02-DECISIONS.md`** — locked decisions (must match the notebook)
4. **The rest of `handover/`** — delete list, plan, tracker
5. **`novelka/context/architecture.md`** — engine invariants only
   (guides, cover, kind tag, KDP math). Not product IA.
6. **Code listed in `07-KEEP-AND-REUSE.md`** — generator / KDP algorithms
7. **Everything else is historical**

`CLIENT-UX-BLUEPRINT.md` is **not** the product anymore. It made Word Search
the 1-click hero. The owner notebook does not.

## Documents that must NOT be followed for the 15-day launch

These are useful as archaeology. They describe the *old* "ship payments and
admin" product. Do not implement them.

| Document | Why it is demoted |
|---|---|
| `novelka/STATUS.md` §4 "Next task — deploy" | Deploy/Stripe is out of launch scope |
| `novelka/SETUP.md` | Account/Stripe/Cloudflare setup is not launch work |
| `novelka/README.md` | Describes Phase 1 Canva editor as the product |
| `docs/*` and `novelka/docs/*` payment, entitlement, admin, beta-ops, staging, production checklists | Old monetization / ops track |
| `novelka/docs/SERVER-AUTHORITY-BLUEPRINT.md` | Server authority is real but not launch work |
| `novelka/docs/archive/*` | Explicitly superseded |
| `novelka/context/progress-tracker.md` | Open questions are now locked in `02-DECISIONS.md` |
| `novelka/context/specs/00-build-plan.md` | Draft; replaced by `11-15-DAY-PLAN.md` |

Root `/docs` is a **duplicate** of `novelka/docs`. Same files, two places.
Do not maintain both. See ISS-014.

## How to resolve a new conflict

1. Check `02-DECISIONS.md`.
2. If still unclear, write one concrete question with 2–3 options in
   `12-PROCESS-TRACKER.md` → Open Owner Questions.
3. **Do not invent a fourth product.** Prefer the smaller, lighter option
   that still ships the golden path.
