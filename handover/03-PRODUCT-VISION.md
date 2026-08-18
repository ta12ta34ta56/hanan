# 03 — Product vision (old vs new)

## The old app (what is in the repo today)

A beginner built a **Canva-inspired PDF editor** and then bolted on:

- 5 puzzle generators (Sudoku, Word Search, Crossword, Maze, Handwriting)
- 129 recolourable SVG stickers / dividers / flourishes
- 20 page templates + 14 rulings
- PDF import, bulk pages, page numbers, filters, shapes, layers
- Feature flags, ad-unlock, paid tiers, UpgradePrompt
- Hidden admin panel (`gpadmin`), owner recovery code, admin SPA
- Stripe checkout + webhook + entitlement grants
- Supabase auth adapter + GDPR export/erasure
- Ratings modal, social links
- A separate server package with RLS, admin API, template publication

**~51,800 lines in `src/`**, 164 TS/TSX files, `App.tsx` 778 lines,
`canvas-engine.ts` 1,446 lines.

The home screen already grew a second identity (CustomerNav: Home / Create /
Projects / Templates + Quick Word Search wizard). The editor is still a
full design surface. Two products live in one tree.

That is why the app feels heavy, confusing, and hard to finish.

## The new app (owner notebook — homepage)

```
[ novelka.space ]
   │
   ├── [ Create a book ] ───────────────────────────────────┐
   │         │                                              │
   │         ▼                                              │
   │    Title (default: New Book)                           │
   │    Paper & binding (5 KDP stocks)                      │
   │    Cover ON → Paperback / Hardcover                    │
   │    Standard trim (no custom)                           │
   │    Page count                                          │
   │    [ Create a book ] ──► EDITOR                        │
   │                                                        │
   └── [ Quick puzzle making ]                              │
             │                                              │
             ▼                                              │
        Sudoku: trim + 4×4/9×9/16×16 + difficulty + count   │
        Maze:   trim + basic inputs                         │
        [ Generate ]
        Word search / crossword / handwriting = EDITOR only ┘
```

Wipe the current home. Two buttons. That is all.

Editor internals: **not received yet.**

## What "the output is very different" means

| | Old output | New output |
|---|---|---|
| First screen | Editor / size cards / sticker energy | One CTA: create a book |
| User job | Design a page | Produce a book |
| Success | Pretty canvas | Print-ready PDF pair |
| Editor | Headline feature | Optional inspection |
| Money | Tiers, ads, upgrade | None |
| Admin | Hidden panel + second SPA | None in customer app |
| Sizes | Custom + 12 presets | 6 fixed trims |
| Assets | 129 stickers | Not a launch surface |

## What stays valuable

The **generators and the KDP math are the product**. They already work and
are tested. The new app is those engines behind a calmer door.

## Visual tone

From `CLIENT-UX-BLUEPRINT.md` and `context/ui-context.md`:

- Spacious, uncrowded, editorial
- Light-first, indigo accent, white paper canvas
- No floating stickers, no clip-art bloat, no marketing widgets
- Honest status, not hype
