# 01 — Authority (which document wins)

The repo contains **conflicting products**. Different files describe different
apps. A previous agent that "just reads the repo" will guess wrong.

## Order of authority (highest first)

1. **`handover/02-DECISIONS.md`** — locked product decisions
2. **`handover/` (this folder)** — mission, delete list, plan, tracker
3. **`novelka/context/architecture.md`** — invariants (guides, cover, kind tag)
4. **`novelka/context/project-overview.md`** — in/out of scope (except where
   this folder narrows launch scope)
5. **`novelka/context/ai-workflow-rules.md`**, `code-standards.md`, `ui-context.md`
6. **`novelka/docs/CLIENT-UX-BLUEPRINT.md`** — UX shape of the new product
   (wizard-first). Use for screen design. Ignore its "7×9 custom trim" and
   ignore any implication that other generators are unfinished (they exist).
7. **Code that is listed in `07-KEEP-AND-REUSE.md`** — treat as correct
   reference for algorithms
8. **Everything else is historical**

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
