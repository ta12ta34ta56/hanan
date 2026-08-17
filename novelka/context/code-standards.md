# Code Standards — Novelka

> Defines TypeScript, framework, file-organization and styling conventions. The goal is
> a codebase that reads the same everywhere — no pattern drift between modules or units.

---

## TypeScript

- **Everything is typed.** No `any` except where a deliberate escape hatch is required
  (`FabricAny = any` in the engine is the one sanctioned boundary for Fabric objects).
- Use **type-only imports** (`import type { Page }`) for types.
- Prefer **union/`const` types** over strings (e.g. `GeneratorKind`, `PageRole`,
  `PaperType`, `BindingType`).
- **Named exports** for functions/types; components are named function components.
- No implicit returns of `Promise<void>` where the caller ignores it — use `void fn()`
  at call sites.

---

## React

- **Function components only.** No classes.
- **Hooks at the top of the component.** Follow the Rules of Hooks.
- **State belongs in Zustand stores** when more than one component needs it, or when it
  must survive navigation. Component-local `useState` is fine for ephemeral UI (a
  dropdown, a draft input) only.
- **Effects** are for external sync (canvas, storage, intervals), not for derived state.
  Derive with `useMemo` instead.
- **No `any` casts in components.** Use proper types.
- Keep components **single-purpose** and reasonably sized. Split when a file grows past
  ~300 lines.

---

## Canvas engine (Fabric)

- **UI never imports Fabric directly** — go through `CanvasEngine` (`src/engine/`).
- Serialization preserves every custom property via the `EXTRA_PROPS` allow-list in
  `canvas-engine.ts`. **If you add a new custom object property that must survive
  save/load, add it to `EXTRA_PROPS`** — otherwise it is silently dropped.
- Every generated object carries its module tags (`kind`, `sudokuPuzzle`, `wsPuzzle`,
  etc.) so grouping/selection/layers stay reliable.
- `setCoords()` and `dirty = true` after mutating object geometry.
- Requests to render go through `canvas.requestRenderAll()`.

---

## Generators (modules)

Each module follows the same internal shape:

```
module/
├── Panel.tsx        # React UI (reads/writes stores + calls build/layout/worker)
├── generator.ts     # Pure puzzle generation (no fabric objects, testable)
├── build-pages.ts   # Builds Page[] from generated puzzles + style + layout
├── layout.ts        # Deterministic layout of one page (pure, re-layout safe)
├── renderer.ts      # Turns a puzzle into fabric objects / style defaults / suggest fns
├── templates.ts     # Module-specific templates (frames + slots)
├── worker.ts        # Optional worker for generation
```

Rules:
- **Layout is deterministic and idempotent.** Re-laying a page from the same spec gives
  the same result; no cumulative drift. Recompute positions from the spec, never from
  the previous output.
- **Suggest functions gate what fits.** `suggestPerPage`, `suggestSolutionsPerPage`
  return only counts that fit the current trim. "1 per page" is always offered first.
- **No dead controls.** Each panel option must have a real effect.

---

## Naming

- Files: `kebab-case.ts`, `PascalCase.tsx` for components.
- Functions/vars: `camelCase`.
- Types/interfaces: `PascalCase` (interfaces without an `I` prefix).
- Constants: `SCREAMING_SNAKE_CASE`.
- CSS classes: `kebab-case`, semantic (`.safe-area`, `.cover-line`).
- Stores: `<name>-store.ts`; store hooks `useXStore`.

---

## Styling

- **Use CSS tokens, never raw hex in components.** The design tokens live in
  `index.css` (`--surface*`, `--lp-*`, `--accent`, `--good/warn/bad`, etc.) and flip for
  light/dark. Components reference tokens; raw colors only appear in `index.css`.
- Inline `style={{...}}` is allowed for dynamic/positional values (canvas coords, zoom)
  but not for theme colors.
- New UI markup that is reusable should get a class in `index.css`, not repeated inline.

---

## Tests

- Unit tests live next to their source as `.test.mjs` and are run by the `test:*` npm
  scripts (e.g. `test:sudoku`, `test:engine`, `test:templates`, `test:cover-guides`).
- Pure domain/service functions are unit-tested. Panel/UI behavior is covered by the
  browser flow suites.
- **A unit is not done until its relevant tests pass** and `npm run build` succeeds.
