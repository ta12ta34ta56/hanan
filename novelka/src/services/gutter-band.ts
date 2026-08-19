import { gutterInchesFor } from './kdp';
import { interiorPageCount, renumberInteriorPages } from './template-groups';
import { refitInteriorPages, type RefitablePage } from './safe-reflow';

/** Amazon's inside-margin steps. Same inches = same category. */
export function gutterBandChanged(fromCount: number, toCount: number): boolean {
  return gutterInchesFor(fromCount) !== gutterInchesFor(toCount);
}

/** Slide leftover ink out of a thicker gutter, then name interiors 1…N. */
export function fitPagesToCategory<T extends RefitablePage & { name: string }>(pages: T[]): T[] {
  return renumberInteriorPages(refitInteriorPages(pages));
}

export function interiorCountOf(pages: Array<{ role?: string }>): number {
  return pages.filter((p) => p.role !== 'cover').length;
}

export function shouldRebuildForGutter(
  previous: Array<{ role?: string }>,
  next: Array<{ role?: string }>,
): boolean {
  return gutterBandChanged(interiorPageCount(previous), interiorPageCount(next));
}
