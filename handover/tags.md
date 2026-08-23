# Tag vocabulary

Use these exact tokens so search works (`rg "area:export" handover`).

## severity (bugs)

| Tag | Meaning |
|---|---|
| `S0` | Crash or data loss |
| `S1` | Golden path broken |
| `S2` | Wrong output / incorrect book |
| `S3` | Polish / UX friction |
| `S4` | Docs / process only |

## launch

| Tag | Meaning |
|---|---|
| `blocker` | Must be done before 2026-09-01 |
| `should` | Do if Units 01–04 are green |
| `later` | After launch |
| `out-of-scope` | Permanently not this product |

## status

`open` · `in-progress` · `done` · `fixed` · `wontfix` · `accepted` · `deferred` · `owner-action`

## area

`ux` · `editor` · `generator` · `kdp` · `export` · `storage` · `auth` · `admin` · `payments` · `perf` · `a11y` · `docs` · `process`

## type

`bug` · `bloat` · `contradiction` · `debt` · `delete` · `keep` · `decision` · `process`

## extra (free-form, keep short)

`serialization` · `watermark` · `guest` · `trim` · `cover` · `wizard`

## Search examples

```bash
rg "launch: blocker" handover
rg "area:kdp" handover
rg "status: open" handover/09-BUG-REGISTRY.md
rg "DEL-" handover/06-DELETE-LIST.md
rg "D-0" handover/02-DECISIONS.md
```
