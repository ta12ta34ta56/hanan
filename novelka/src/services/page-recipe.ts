import type { Page } from '../types/canvas.types';

/** Stamped when a page template is applied with Replace. Rebuild uses this. */
export const PAGE_TEMPLATE = 'novelka:page-template';
/** Stamped when a Lines & Grids ruling is applied with Replace. */
export const PAGE_RULING = 'novelka:page-ruling';

export interface PageTemplateRecipe {
  templateId: string;
  font: string;
}

export interface PageRulingRecipe {
  rulingId: string;
  color: string;
  spacing: number;
  weight: number;
}

function dataOf(page: Page): Record<string, unknown> | null {
  return page.data && typeof page.data === 'object' ? (page.data as Record<string, unknown>) : null;
}

export function pageTemplateRecipeOf(page: Page): PageTemplateRecipe | null {
  const raw = dataOf(page)?.[PAGE_TEMPLATE];
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.templateId !== 'string' || !rec.templateId) return null;
  return { templateId: rec.templateId, font: typeof rec.font === 'string' ? rec.font : 'Inter' };
}

export function pageRulingRecipeOf(page: Page): PageRulingRecipe | null {
  const raw = dataOf(page)?.[PAGE_RULING];
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.rulingId !== 'string' || !rec.rulingId) return null;
  return {
    rulingId: rec.rulingId,
    color: typeof rec.color === 'string' ? rec.color : '#c9d1dc',
    spacing: typeof rec.spacing === 'number' && Number.isFinite(rec.spacing) ? rec.spacing : 1,
    weight: typeof rec.weight === 'number' && Number.isFinite(rec.weight) ? rec.weight : 1,
  };
}

export function withPageTemplateRecipe(page: Page, recipe: PageTemplateRecipe): Page {
  const data = dataOf(page) ?? { version: '6.0.0', background: page.background ?? '#ffffff', objects: [] };
  return { ...page, data: { ...data, [PAGE_TEMPLATE]: recipe } };
}

export function withPageRulingRecipe(page: Page, recipe: PageRulingRecipe): Page {
  const data = dataOf(page) ?? { version: '6.0.0', background: page.background ?? '#ffffff', objects: [] };
  return { ...page, data: { ...data, [PAGE_RULING]: recipe } };
}
