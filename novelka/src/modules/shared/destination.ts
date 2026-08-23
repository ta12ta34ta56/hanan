import { nanoid } from 'nanoid';
import { isCover, type Page } from '../../types/canvas.types';
import { fitPagesToCategory, gutterBandChanged } from '../../services/gutter-band';
import { interiorPageCount, renumberInteriorPages } from '../../services/template-groups';

/**
 * Where generated puzzle pages land in the book.
 *
 * Owner notebook: All pages / Blank pages only / Append to the end.
 * Replace overwrites the destination instead of stacking on old puzzles.
 * If the book is too short for the puzzles AND their solutions, add pages.
 * Cover is never touched.
 */
export type PuzzleDestination = 'all' | 'blank' | 'append';

export const DESTINATION_OPTIONS: {
  v: PuzzleDestination;
  label: string;
  hint: string;
}[] = [
  { v: 'all', label: 'All pages', hint: 'Write onto every interior page' },
  { v: 'blank', label: 'Blank pages only', hint: 'Fill empty interiors first' },
  { v: 'append', label: 'Append to the end', hint: 'Add after the last page' },
];

/** Roles the owner said may stay editable after Generate. */
const EDITABLE_ROLES = new Set([
  'sudoku-label',
  'ws-label',
  'ws-title',
  'ws-subtitle',
  'ws-folio',
  'cw-label',
  'mz-label',
  'title',
  'subtitle',
  'caption',
  'page-number',
  'quote',
  'instruction',
  'mz-chrome',
  'hw-chrome',
]);

/** The puzzle itself — grid, letters, walls. Quotes and titles stay free. */
const LOCKED_ROLE_PREFIXES = [
  'sudoku-clue',
  'sudoku-answer',
  'sudoku-rule',
  'sudoku-bg',
  'sudoku-coord',
  'ws-letter',
  'ws-rule',
  'ws-frame',
  'ws-shade',
  'ws-bank',
  'ws-answer',
  'ws-bg',
  'ws-divider',
  'cw-cell',
  'cw-block',
  'cw-frame',
  'cw-number',
  'cw-answer',
  'cw-clue',
  'mz-wall',
  'mz-solution',
  'mz-start',
  'mz-end',
  'mz-bg',
  'hw-guide',
  'hw-trace',
  'hw-dot',
  'hw-hunt',
  'hw-match',
  'hw-start-',
  'hw-arrow-',
  'hw-stroke',
];

export function isEditablePuzzleRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  return EDITABLE_ROLES.has(role) || role.endsWith('-chrome');
}

function isLockedPuzzleRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  if (isEditablePuzzleRole(role)) return false;
  return LOCKED_ROLE_PREFIXES.some((p) => role === p || role.startsWith(p));
}

export function isBlankInterior(page: Page): boolean {
  if (isCover(page)) return false;
  const data = page.data as { objects?: unknown[] } | null;
  const objs = data?.objects;
  return !Array.isArray(objs) || objs.length === 0;
}

function lockNode(node: Record<string, unknown>): void {
  const role =
    node.sudokuRole ??
    node.wsRole ??
    node.cwRole ??
    node.mzRole ??
    node.hwRole ??
    node.instanceRole ??
    node.role;

  const kids = node.objects;
  if (isLockedPuzzleRole(role)) {
    node.locked = true;
    node.selectable = false;
    node.evented = false;
    node.hasControls = false;
    node.lockMovementX = true;
    node.lockMovementY = true;
    node.lockScalingX = true;
    node.lockScalingY = true;
    node.lockRotation = true;
  }

  if (Array.isArray(kids)) {
    for (const kid of kids) {
      if (kid && typeof kid === 'object') lockNode(kid as Record<string, unknown>);
    }
  }
}

/** Lock puzzle content on a built page. Title / number / difficulty stay free. */
export function lockPuzzlePage(page: Page): Page {
  const data = page.data as { objects?: unknown[] } | null;
  if (!data || !Array.isArray(data.objects)) return page;
  const objects = data.objects.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const next = { ...(raw as Record<string, unknown>) };
    lockNode(next);
    return next;
  });
  return { ...page, data: { ...data, objects } };
}

function blankInterior(
  index: number,
  size: { width: number; height: number; background?: string | null },
): Page {
  return {
    id: nanoid(8),
    name: `Page ${index}`,
    width: size.width,
    height: size.height,
    background: size.background ?? '#ffffff',
    role: 'interior',
    data: null,
  };
}

function stackPages(dest: Page, src: Page): Page {
  const destData = (dest.data ?? {
    version: '6.0.0',
    background: dest.background ?? '#ffffff',
    objects: [],
  }) as Record<string, unknown>;
  const srcData = (src.data ?? {}) as Record<string, unknown>;
  const existing = Array.isArray(destData.objects) ? destData.objects : [];
  const incoming = Array.isArray(srcData.objects) ? srcData.objects : [];
  const merged: Record<string, unknown> = {
    ...destData,
    ...srcData,
    objects: [...existing, ...incoming],
    background: dest.background ?? src.background ?? '#ffffff',
  };
  return {
    ...src,
    id: dest.id,
    width: dest.width,
    height: dest.height,
    background: dest.background ?? src.background,
    data: merged,
  };
}

function writePage(dest: Page, src: Page, replace: boolean): Page {
  if (replace || isBlankInterior(dest)) {
    return {
      ...src,
      id: dest.id,
      width: dest.width,
      height: dest.height,
      background: dest.background ?? src.background,
    };
  }
  return stackPages(dest, src);
}

export interface ApplyGeneratedResult {
  pages: Page[];
  firstId: string;
  added: number;
}

/**
 * Merge generated pages into the current book.
 *
 * Cover stays first and is never overwritten. Extra interiors are created
 * automatically when the destination does not have enough slots.
 */
export function applyGeneratedPages(opts: {
  built: Page[];
  current: Page[];
  destination: PuzzleDestination;
  replace: boolean;
}): ApplyGeneratedResult {
  const built = opts.built.map(lockPuzzlePage);
  if (!built.length) {
    return { pages: opts.current, firstId: opts.current[0]?.id ?? '', added: 0 };
  }

  const covers = opts.current.filter(isCover);
  const interiors = opts.current.filter((p) => !isCover(p));
  const paperBg = interiors[0]?.background ?? built[0].background ?? '#ffffff';
  const size = {
    width: interiors[0]?.width ?? built[0].width,
    height: interiors[0]?.height ?? built[0].height,
    background: paperBg,
  };
  const painted = built.map((p) => ({ ...p, background: paperBg }));

  const finish = (next: Page[]) =>
    gutterBandChanged(interiorPageCount(opts.current), interiorPageCount(next))
      ? fitPagesToCategory(next)
      : renumberInteriorPages(next);

  if (opts.destination === 'append') {
    return {
      pages: finish([...covers, ...interiors, ...painted]),
      firstId: painted[0].id,
      added: painted.length,
    };
  }

  const want = painted.length;
  const slots: number[] = [];
  interiors.forEach((page, i) => {
    if (opts.destination === 'all' || isBlankInterior(page)) slots.push(i);
  });

  const extra = Math.max(0, want - slots.length);
  const extras = Array.from({ length: extra }, (_, i) =>
    blankInterior(interiors.length + i + 1, size),
  );
  extras.forEach((_, i) => slots.push(interiors.length + i));

  const nextInteriors = [...interiors, ...extras];
  const used = slots.slice(0, want);
  used.forEach((idx, bi) => {
    nextInteriors[idx] = writePage(nextInteriors[idx], painted[bi], opts.replace);
  });

  return {
    pages: finish([...covers, ...nextInteriors]),
    firstId: nextInteriors[used[0]]?.id ?? painted[0].id,
    added: extra,
  };
}

/**
 * Where a new batch should start, and how thick the finished book will be.
 * Generators must use this so the gutter is the real book's gutter, not the
 * size of the batch alone.
 */
export function generatePlacement(
  current: Array<{ role?: string }>,
  destination: PuzzleDestination,
  builtCount: number,
): { startPageNumber: number; pageCount: number } {
  const interiors = current.filter((p) => p.role !== 'cover').length;
  const extra = Math.max(0, builtCount);
  if (destination === 'append') {
    return {
      startPageNumber: interiors + 1,
      pageCount: interiors + extra,
    };
  }
  return {
    startPageNumber: 1,
    pageCount: Math.max(interiors, extra),
  };
}

/** Density comes from the template, never a puzzles-per-page control. */
export function densityFromTemplate(supports: number[] | undefined): number {
  const n = supports?.[0];
  return typeof n === 'number' && n > 0 ? n : 1;
}

/** Keep only solution counts that fit this trim, from an allowed list. */
export function filterSolutionCounts(
  offered: number[],
  allowed: number[],
): number[] {
  const keep = offered.filter((n) => allowed.includes(n));
  return keep.length ? keep : [allowed[0] ?? 1];
}
