# 00 — Mission

## Why this exists

The owner spent ~2 months building their first app. It grew into a 51,000-line
React/Fabric editor with puzzle generators, a Canva-style canvas, payments,
admin, feature flags, ratings, SVG stickers, PDF import, and a backend that is
tested but not the product.

The owner has now decided:

- The **output** of the product is very different from what is in the repo today.
- Many things are **permanently out of scope** and should be deleted from the
  customer product.
- The app must become **light** and **launch before college** (15 days from
  2026-08-18 → **2026-09-01**).
- A new agent will do the work **without the owner prompting**. This folder is
  that agent's memory.

This documentation session **did not change any application code.**

---

## What Novelka is now

> Novelka is a web app that turns a puzzle idea into a **print-ready KDP
> low-content book** in minutes.

A user picks a standard KDP trim, chooses a generator (Word Search is the
launch path), sets volume, and Novelka lays out the whole book — puzzles,
answer key, optional cover — inside KDP gutters, bleed and safe margins.
The user reviews, preflights, and exports interior + cover PDFs.

**It is a book producer. It is not Canva.**

---

## Launch promise (from the owner notebook — homepage half)

A guest opens novelka.space and sees **only two actions**:

1. **Create a book** — title, paper & binding, cover (on) + paperback/hardcover,
   standard trim, page count → **editor**.
2. **Quick puzzle making** — Sudoku or Maze, basic inputs, Generate.
   Word search / crossword / handwriting are not in this window.

No Canva home. No payments. No login. No Supabase. No admin. No server.

The editor half of the promise is **not written yet**. Do not invent it.

---

## What success looks like

- [ ] Golden path above works in under ~10 clicks.
- [ ] Generated pages at every **launch trim** pass preflight for standard
      content (no content outside the safe area).
- [ ] No console errors and no crash across create → edit → export.
- [ ] Every visible control on the launch path does something real.
- [ ] Customer UI has no Admin, no Upgrade, no Stripe, no ads, no custom size.
- [ ] Relevant unit tests pass; `npm run build` passes.
- [ ] The app feels smaller: fewer panels, fewer rails, fewer ways to get lost.

---

## What you are not here to do

- Rebuild the generators from scratch.
- Deploy Stripe / Supabase / Cloudflare as a launch blocker.
- Finish the admin control plane.
- Add new puzzle types.
- Add a marketplace, collaboration, mobile-native app, or AI content.
- Keep the Canva editor as the first experience.
- "Improve" files outside the current unit.

---

## Working method

```
read this folder
    → take the next unit from 11-15-DAY-PLAN.md
        → implement only that unit
            → verify (14-VERIFICATION.md)
                → update 12-PROCESS-TRACKER.md
                    → append 15-SESSION-LOG.md
                        → stop or take the next unit
```

If you get lost, re-read `13-AGENT-RULES.md` and `02-DECISIONS.md`.
