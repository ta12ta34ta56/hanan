# 13 — Agent rules

You are the implementation agent. The owner will **not** sit with you.
This folder is your memory. Follow it.

---

## Identity of the work

- You are reshaping Novelka into a light KDP book producer.
- You are not the previous "deploy Stripe" agent.
- You are not allowed to start a new repository or a greenfield rewrite.

## Before you write code

1. Read `handover/README.md` and the files it lists, in order.
2. Read `12-PROCESS-TRACKER.md` — do the **Single next action**.
3. If that action is done, take the next unit from `11-15-DAY-PLAN.md`.

## While you write code

1. **One unit.** No drive-by refactors.
2. **No speculative packages.**
3. **Do not rewrite** anything in `07-KEEP-AND-REUSE.md`.
4. **Do not implement** anything in `06-DELETE-LIST.md` P2.
5. **Do not guess** product questions. D-25: pick the smaller option that
   still ships the golden path, log it as `ASSUMED`.
6. **Do not commit secrets.** No `.env` with real keys. No service-role values.
7. **Stay on branch** `arena/01a015b6-hanan` if that is the session branch.
   Do not switch branches.
8. UI colors come from tokens (`ui-context.md`). Canvas paper stays white.
9. If you add a persisted custom Fabric prop, update **both** allow-lists (D-22).
10. Do not paper over bugs. If you break something, revert the smallest set.

## After you write code

1. Run the verification for that unit (`14-VERIFICATION.md` + the unit's list).
2. Update `12-PROCESS-TRACKER.md`.
3. Append `15-SESSION-LOG.md`.
4. File any new bug/issue with the templates. Give it an ID. Tag it.
5. Leave the tree buildable.

## Authority when instructions collide

See `01-AUTHORITY.md`. Short version: **handover/ wins**, then architecture
invariants, then project-overview, then code listed as keep.

## What "without the owner prompting" means

- Do not stop to ask "should I delete admin / Supabase / the server?"
  Owner said delete them completely.
- Do not stop to ask "rewrite or refactor?"
- Do not build the editor until `16-OWNER-NOTEBOOK.md` has an Editor section.
- Those homepage questions are answered. Editor is not.
- You **may** stop only if continuing would destroy user data or ship a
  known S0 on the golden path with no workaround. Then write the blocker
  in the tracker and make the rest of the unit safe.

## Tone of the product

Calm, honest, small. If a control does not help a beginner make a KDP book
this week, it does not belong on the screen.

## Environment hygiene

- Work in `novelka/` for app commands (`npm install`, `npm run dev`, tests).
- Kill leftover Vite/Chrome before heavy tests (BUG-010).
- Bind dev servers to `0.0.0.0` if a preview host is required.
- Do not call `localhost` from browser-facing code to reach another service.

## Git

- Prefer small commits per unit: `Unit 01: remove customer paywall and admin unlock`
- Do not force-push.
- Do not commit `node_modules`, build output, or secrets.
