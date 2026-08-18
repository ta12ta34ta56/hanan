# 15 — Session log (append only)

Newest session at the top.

---

## 2026-08-18 — Documentation / memory only

**Agent role:** handover writer. **Code changed:** none.

### Why
Owner: first beginner app, ~2 months, college in 15 days. Do not fix code.
Write a folder of issues, redesign, architecture, process tracking, and
bug tags so a *new* agent can work without the owner prompting. Many things
are permanently out of scope. The output of the product is very different
from the current Canva-like app.

### What was found
- `novelka/src` ≈ 51.8k lines, 164 TS/TSX files.
- Two products in one tree: a Fabric design editor + a book-producer wizard.
- Five generators are real and tested. KDP math is real and tested.
- Payments, admin, flags, ads, custom sizes, sticker rail still live in the
  customer app.
- Docs contradict each other (STATUS says deploy Stripe next; context says
  no payments; Blueprint says wizard-first; README says Canva Phase 1).
- `context/progress-tracker.md` still had open questions. Those are now locked
  in `02-DECISIONS.md`.

### What was written
The entire `/handover` folder (this file included).

### What the next session must do
Start **Unit 01 — Customer-clean**. See `12-PROCESS-TRACKER.md`.

### Verification
Not applicable (no app code).
