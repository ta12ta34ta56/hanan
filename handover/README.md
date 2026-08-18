# HANDOVER — start here

**This folder is the next agent's memory.**

Do not start by reading `novelka/README.md`, `novelka/STATUS.md`, or the
beta/payment docs. Those describe the *old* product (a Canva-like editor plus
Stripe/admin/server). This folder describes the *new* product and the 15-day
launch. If another document disagrees with this folder, **this folder wins.**

```
Owner:          first-ever beginner app, ~2 months of work
Deadline:       college starts in 15 days from 2026-08-18  →  target 2026-09-01
This session:   documentation only. No code was changed.
Next session:   a new agent implements from this folder without the owner prompting.
```

---

## Read in this order (do not skip)

| # | File | Why |
|---|---|---|
| 1 | `13-AGENT-RULES.md` | How you are allowed to work |
| 2 | `01-AUTHORITY.md` | Which documents win when they conflict |
| 3 | `00-MISSION.md` | What you are here to ship |
| 4 | `02-DECISIONS.md` | Locked decisions. Never re-open. Never guess. |
| 5 | `03-PRODUCT-VISION.md` | Old app vs new app |
| 6 | `06-DELETE-LIST.md` | What is permanently out of the customer product |
| 7 | `07-KEEP-AND-REUSE.md` | What you must not rewrite |
| 8 | `08-ISSUE-REGISTRY.md` | All known issues, tagged |
| 9 | `09-BUG-REGISTRY.md` | All known bugs, tagged |
| 10 | `11-15-DAY-PLAN.md` | The unit-by-unit plan |
| 11 | `12-PROCESS-TRACKER.md` | Living memory. Update every session. |
| 12 | `14-VERIFICATION.md` | How to know a unit is done |

Then implement **one unit** from the plan. After every unit, update
`12-PROCESS-TRACKER.md` and append `15-SESSION-LOG.md`.

---

## What this folder is

- A complete brief so a new agent can work **without the owner in the loop**
- A process tracker (memory of what was decided, what is next, what is blocked)
- An issue + bug registry with a tag system you can search
- Templates for new issues, bugs, sessions, and units
- A delete list and a keep list

## What this folder is not

- Not a license to rewrite the app from zero
- Not a license to keep building payments, admin, ads, or a Canva clone
- Not a dump of old STATUS.md / SETUP.md / beta plans

---

## The one-sentence job

**Turn Novelka from a heavy Canva-like editor into a light, reliable KDP book
producer, and get a guest-usable Word Search book (create → preview →
preflight → export) launching before 2026-09-01.**

---

## Hard rules (repeated because they matter)

1. **Do not touch code until you have read files 1–12 above.**
2. **Do not guess.** If a decision is not in `02-DECISIONS.md`, stop and write
   the question in `12-PROCESS-TRACKER.md` → Open Owner Questions. Do not invent.
3. **Do not rewrite generator algorithms or KDP math.**
4. **Do not work on payments, Stripe, admin, ads, or server deploy.** Those are
   permanently out of the 15-day launch.
5. **One unit at a time.** Update the tracker after every unit.
6. **Search this folder by tag** (`tags.md`) before opening a new issue.

---

## Quick search

| I need… | Open |
|---|---|
| What to build | `00-MISSION.md`, `03-PRODUCT-VISION.md` |
| What is decided | `02-DECISIONS.md` |
| What to delete | `06-DELETE-LIST.md` |
| What to keep | `07-KEEP-AND-REUSE.md` |
| A known bug | `09-BUG-REGISTRY.md` |
| A known issue / improvement | `08-ISSUE-REGISTRY.md` |
| Today's next action | `12-PROCESS-TRACKER.md` |
| How to file a new bug | `templates/BUG.md` |
| How to file a new issue | `templates/ISSUE.md` |
| Tag vocabulary | `tags.md` |
