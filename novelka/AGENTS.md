## Application Building Context

Read the following files **in order** before implementing anything or making any
architectural decision:

1. `context/project-overview.md` — product definition, goals, features, scope (in/out)
2. `context/architecture.md` — system structure, boundaries, storage model, invariants
3. `context/ui-context.md` — theme, colors, typography, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, verification
6. `context/progress-tracker.md` — current phase, completed work, open questions, next steps

Also read `context/specs/*.md` for the specific unit you are implementing.

**Rules:**

- Update `context/progress-tracker.md` after each meaningful implementation change.
- If an implementation changes the architecture, scope, or standards documented in the
  context files, update the relevant file before continuing.
- Respect the invariants in `context/architecture.md` (guide overlays are DOM-only; the
  cover is isolated; "apply to all" uses the `kind` tag; generated pages use interior
  trim size; fixed KDP trims only; no free-form drag-and-drop design; real font files).
