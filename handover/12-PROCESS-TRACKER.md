# 12 — Process tracker (living memory)

**The next agent updates this file after every unit and every session.**
If this file is stale, you are failing the job.

---

## Snapshot

| Field | Value |
|---|---|
| Date (last update) | 2026-08-18 |
| Phase | **Phase 0 complete — handover written. Implementation not started.** |
| Current unit | **Unit 01 — Customer-clean** (not started) |
| Status | `READY-FOR-IMPLEMENTATION` |
| Launch target | 2026-09-01 |
| Days remaining (as of last update) | 15 |
| Blocker? | None. Start Unit 01. |
| Last agent action | Wrote `/handover` documentation only. **Zero application code changed.** |

---

## Single next action

```
Open handover/11-15-DAY-PLAN.md Unit 01.
Remove customer-facing payments, admin, ads, custom-size, and requireEditorAuth.
Do not touch generators. Do not deploy anything.
```

---

## Phase checklist

- [x] P0 Documentation / memory folder
- [ ] Unit 01 Customer-clean
- [ ] Unit 02 Wizard golden path
- [ ] Unit 03 Honest geometry
- [ ] Unit 04 Preview + preflight + export   ← launchable
- [ ] Unit 05 Storage honesty
- [ ] Unit 06 Light cover
- [ ] Unit 07 Slim editor
- [ ] Unit 08 Secondary generators or hide
- [ ] Unit 09 Polish
- [ ] Unit 10 Docs pointers + freeze
- [ ] Buffer / demo

---

## Decisions made this session (2026-08-18, docs-only)

All locked in `02-DECISIONS.md`. Highlights:

- Product = book producer, not Canva
- Prune + reshape, not rewrite
- Word Search launch path
- Guest first, no money, no admin, no server deploy
- Fixed 6 trims
- This folder is authority

No `ASSUMED` decisions beyond those documented as locked.

---

## Open owner questions

**None.** If you believe you need one, you are probably about to violate
D-25. Write it here only if both options break the golden path.

| ID | Question | Options | Needed by unit |
|---|---|---|---|
| — | — | — | — |

---

## Assumptions log

| Date | ID | Assumption | Why |
|---|---|---|---|
| 2026-08-18 | A-01 | 15 days counted from 2026-08-18 inclusive of weekends → ship 2026-09-01 | Owner said college in 15 days |
| 2026-08-18 | A-02 | Word Search is the only launch hero | Blueprint + existing wizard + deadline |
| 2026-08-18 | A-03 | Server/admin/payments stay in the git tree but frozen | Safer than a mass delete on day 1 |
| 2026-08-18 | A-04 | Launch trim list is the 6 in D-09 | Intersection of KDP-common + existing presets, minus custom/7×9 |

---

## Work log (append a one-liner per unit)

| Date | Unit | Result | Tests | Notes |
|---|---|---|---|---|
| 2026-08-18 | docs | Handover folder created | n/a | No code touched |

---

## Files the implementation agent may create/change first

Expected for Unit 01 (guidance, not a cage):

- `novelka/src/App.tsx` (remove admin unlock, requireEditorAuth, rating nags)
- Customer home/create views (remove import-PDF / paywall / custom size)
- New Book / wizard pickers (D-09 trims)
- Possibly stop importing UpgradePrompt, payments, admin-access

Do not start with `server/`, `src/admin/`, or any `generator.ts`.

---

## How to update this file (every session)

1. Set Date, Current unit, Status, Days remaining.
2. Rewrite **Single next action** as one paragraph the next session can obey.
3. Tick phase checkboxes.
4. Append Work log.
5. Move any new assumption into the assumptions log.
6. Append `15-SESSION-LOG.md` with the longer narrative.
