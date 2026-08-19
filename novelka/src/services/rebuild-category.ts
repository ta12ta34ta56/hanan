import * as fabric from 'fabric';
import { isCover, type Page } from '../types/canvas.types';
import { IN } from '../types/canvas.types';
import { TEMPLATES, buildTemplateJSON } from './templates';
import { RULINGS } from './rulings';
import {
  interiorPageCount,
  interiorPageNumber,
  renumberInteriorPages,
} from './template-groups';
import { refitInteriorPages } from './safe-reflow';
import {
  pageRulingRecipeOf,
  pageTemplateRecipeOf,
  withPageRulingRecipe,
  withPageTemplateRecipe,
} from './page-recipe';

/**
 * Remake interiors for the book's current gutter category.
 * Cover is never touched. Same puzzles / same templates, new fit.
 */

function interiorsOf(pages: Page[]): Page[] {
  return pages.filter((p) => !isCover(p));
}

function withCovers(pages: Page[], interiors: Page[]): Page[] {
  const covers = pages.filter(isCover);
  return covers.length ? [covers[0], ...interiors] : interiors;
}

async function rebuildPageRecipes(pages: Page[]): Promise<Page[]> {
  const count = interiorPageCount(pages);
  const out: Page[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (isCover(page)) {
      out.push(page);
      continue;
    }
    const pageNumber = interiorPageNumber(pages, i);
    const template = pageTemplateRecipeOf(page);
    if (template) {
      const def = TEMPLATES.find((t) => t.id === template.templateId);
      if (def) {
        const objects = await buildTemplateJSON(def, {
          w: page.width,
          h: page.height,
          font: template.font,
          pageNumber,
          pageCount: count,
        });
        out.push(
          withPageTemplateRecipe(
            {
              ...page,
              data: {
                version: '6.0.0',
                background: page.background ?? '#ffffff',
                objects,
              },
            },
            template,
          ),
        );
        continue;
      }
    }
    const ruling = pageRulingRecipeOf(page);
    if (ruling) {
      const def = RULINGS.find((r) => r.id === ruling.rulingId);
      if (def) {
        const objs = def.build({
          w: page.width,
          h: page.height,
          pageNumber,
          pageCount: count,
          color: ruling.color,
          spacingScale: ruling.spacing,
          weightScale: ruling.weight,
          kdpSafe: true,
          plainMargin: 0.5 * IN,
        });
        objs.forEach((o) => {
          (o as unknown as { name: string }).name = 'novelka:ruling';
        });
        const el = document.createElement('canvas');
        const tmp = new fabric.StaticCanvas(el, { width: page.width, height: page.height });
        objs.forEach((o) => tmp.add(o));
        const json = tmp.toObject(['id', 'elementType', 'name', 'locked']) as { objects: unknown[] };
        tmp.dispose();
        out.push(
          withPageRulingRecipe(
            {
              ...page,
              data: {
                version: '6.0.0',
                background: page.background ?? '#ffffff',
                objects: json.objects,
              },
            },
            ruling,
          ),
        );
        continue;
      }
    }
    out.push(page);
  }
  return out;
}

async function reflowPuzzles(pages: Page[]): Promise<Page[]> {
  let interiors = interiorsOf(pages);

  const { sudokuMetaOf } = await import('../modules/sudoku-maker/build-pages');
  const { applySpecToPages, DEFAULT_SPEC } = await import('../modules/sudoku-maker/layout');
  const sudokuKeys = new Map<string, { kind: 'puzzle' | 'solution'; perPage: number; cells: number }>();
  for (const p of interiors) {
    const meta = sudokuMetaOf(p);
    if (!meta || meta.kind === 'heading') continue;
    const key = `${meta.kind}|${meta.perPage}`;
    if (sudokuKeys.has(key)) continue;
    const objs = ((p.data as { objects?: Array<Record<string, unknown>> } | null)?.objects ?? []);
    const rules = objs.filter((o) => String(o.sudokuRole ?? '').startsWith('sudoku-rule'));
    const cells = rules.length >= 10 ? Math.max(4, Math.round(rules.length / 2) - 1) : 9;
    sudokuKeys.set(key, { kind: meta.kind, perPage: meta.perPage, cells });
  }
  for (const c of sudokuKeys.values()) {
    const r = await applySpecToPages(
      interiors,
      { ...DEFAULT_SPEC, boxSize: 0 },
      c.cells,
      c.kind,
      c.perPage,
    );
    interiors = r.pages;
  }

  const { wsMetaOf } = await import('../modules/word-search/build-pages');
  const { wsApplySpecToPages, DEFAULT_WS_SPEC } = await import('../modules/word-search/layout');
  const wsKeys = new Map<string, { kind: 'puzzle' | 'solution'; perPage: number }>();
  for (const p of interiors) {
    const meta = wsMetaOf(p);
    if (!meta) continue;
    wsKeys.set(`${meta.kind}|${meta.perPage}`, { kind: meta.kind, perPage: meta.perPage });
  }
  for (const c of wsKeys.values()) {
    const r = await wsApplySpecToPages(interiors, { ...DEFAULT_WS_SPEC, boxSize: 0 }, c.kind, c.perPage);
    interiors = r.pages;
  }

  const { cwMetaOf } = await import('../modules/crossword/build-pages');
  const { cwApplySpecToPages, DEFAULT_CW_SPEC } = await import('../modules/crossword/layout');
  const cwKeys = new Map<string, { kind: 'puzzle' | 'solution'; perPage: number }>();
  for (const p of interiors) {
    const meta = cwMetaOf(p);
    if (!meta) continue;
    cwKeys.set(`${meta.kind}|${meta.perPage}`, { kind: meta.kind, perPage: meta.perPage });
  }
  for (const c of cwKeys.values()) {
    const r = await cwApplySpecToPages(interiors, { ...DEFAULT_CW_SPEC, boxSize: 0 }, c.kind, c.perPage, 0);
    interiors = r.pages;
  }

  const { mzMetaOf } = await import('../modules/maze/build-pages');
  const { mzApplySpecToPages } = await import('../modules/maze/layout');
  const { DEFAULT_MAZE_STYLE } = await import('../modules/maze/renderer');
  const { DEFAULT_MAZE } = await import('../modules/maze/generator');
  const mazeIds = new Set<string>();
  for (const p of interiors) {
    const meta = mzMetaOf(p);
    if (meta) mazeIds.add(meta.templateId);
  }
  for (const templateId of mazeIds) {
    const sample = interiors.find((p) => mzMetaOf(p)?.templateId === templateId);
    const meta = sample ? mzMetaOf(sample) : null;
    if (!meta) continue;
    const r = await mzApplySpecToPages(
      interiors,
      {
        boxSize: 9999,
        wallColor: DEFAULT_MAZE_STYLE.wallColor,
        wallWidth: DEFAULT_MAZE_STYLE.wallWidth,
        solutionColor: DEFAULT_MAZE_STYLE.solutionColor,
        showSolution: meta.kind === 'solution',
        roundCaps: DEFAULT_MAZE_STYLE.roundCaps,
        kdpSafe: true,
        offsetX: 0,
        offsetY: 0,
      },
      DEFAULT_MAZE_STYLE,
      templateId,
      {
        width: DEFAULT_MAZE.width,
        height: DEFAULT_MAZE.height,
        braid: DEFAULT_MAZE.braid,
        startsAt: DEFAULT_MAZE.startsAt,
      },
    );
    interiors = r.pages;
  }

  const { hwMetaOf } = await import('../modules/handwriting/build-pages');
  const { hwApplySpecToPages } = await import('../modules/handwriting/layout');
  const { DEFAULT_STYLE } = await import('../modules/handwriting/renderer');
  const hwIds = new Set<string>();
  for (const p of interiors) {
    const meta = hwMetaOf(p);
    if (meta?.kind === 'worksheet') hwIds.add(meta.templateId);
  }
  for (const templateId of hwIds) {
    const sample = interiors.find((p) => hwMetaOf(p)?.templateId === templateId);
    const meta = sample ? hwMetaOf(sample) : null;
    if (!meta) continue;
    const r = await hwApplySpecToPages(
      interiors,
      {
        rowHeight: 9999,
        rows: meta.rows || 6,
        tracePerRow: meta.tracePerRow || 3,
        traceColor: DEFAULT_STYLE.traceColor,
        guideColor: DEFAULT_STYLE.guideColor,
        traceWidth: DEFAULT_STYLE.traceWidth,
        guideWidth: DEFAULT_STYLE.guideWidth,
        guideStyle: DEFAULT_STYLE.guideStyle,
        showStrokeNumbers: DEFAULT_STYLE.showStrokeNumbers,
        strokeArrows: true,
        startDots: true,
        style: meta.style,
        kdpSafe: true,
        offsetY: 0,
      },
      DEFAULT_STYLE,
      templateId,
    );
    interiors = r.pages;
  }

  return withCovers(pages, interiors);
}

/** Same book, new category. Cover stays. Interiors remade to fit. */
export async function rebuildBookForCategory(pages: Page[]): Promise<Page[]> {
  let next = await rebuildPageRecipes(pages);
  next = await reflowPuzzles(next);
  return renumberInteriorPages(refitInteriorPages(next));
}
