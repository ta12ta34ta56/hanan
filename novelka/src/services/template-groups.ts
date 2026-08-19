import type { Page } from '../types/canvas.types';

/** Gallery grouping + pair apply. No invented pair artwork. */

export interface GroupableTemplate {
  id: string;
  name: string;
  variantGroup?: string;
  variantLabel?: string;
  pairGroup?: string;
  pairSide?: 'left' | 'right';
  lineColorable?: boolean;
}

export interface TemplateCard<T extends GroupableTemplate> {
  key: string;
  name: string;
  primary: T;
  variants: T[];
  isPair: boolean;
  pairMate?: T;
}

export function groupTemplateCards<T extends GroupableTemplate>(items: T[]): TemplateCard<T>[] {
  const seen = new Set<string>();
  const cards: TemplateCard<T>[] = [];

  for (const t of items) {
    if (seen.has(t.id)) continue;
    if (t.variantGroup) {
      const sibs = items.filter((x) => x.variantGroup === t.variantGroup);
      sibs.forEach((s) => seen.add(s.id));
      cards.push({
        key: `var:${t.variantGroup}`,
        name: t.name.replace(/\s+\((thin|wide|bold|standard)\)/i, '').trim() || t.name,
        primary: sibs[0],
        variants: sibs,
        isPair: false,
      });
      continue;
    }
    if (t.pairGroup && t.pairSide === 'right') {
      seen.add(t.id);
      continue;
    }
    if (t.pairGroup && t.pairSide === 'left') {
      const mate = items.find((x) => x.pairGroup === t.pairGroup && x.pairSide === 'right');
      seen.add(t.id);
      if (mate) seen.add(mate.id);
      cards.push({
        key: `pair:${t.pairGroup}`,
        name: t.name,
        primary: t,
        variants: [t],
        isPair: true,
        pairMate: mate,
      });
      continue;
    }
    seen.add(t.id);
    cards.push({
      key: t.id,
      name: t.name,
      primary: t,
      variants: [t],
      isPair: false,
    });
  }
  return cards;
}

/** Interior index 0 = first interior = verso (even printed page) → left. */
export function pairSideForInteriorIndex(interiorIndex: number): 'left' | 'right' {
  return interiorIndex % 2 === 0 ? 'left' : 'right';
}

export function pickPairTemplate<T extends GroupableTemplate>(
  left: T,
  right: T | undefined,
  interiorIndex: number,
): T {
  if (!right) return left;
  return pairSideForInteriorIndex(interiorIndex) === 'left' ? left : right;
}

export function isCoverPage(page: Page): boolean {
  return page.role === 'cover';
}
