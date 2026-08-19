import type * as fabric from 'fabric';

/**
 * Shared page-template types. Kept out of templates.ts so variant extras
 * can import them without a circular module.
 */
export interface TemplateContext {
  w: number;
  h: number;
  font: string;
  /** 1-based page number — decides which side the gutter is on */
  pageNumber: number;
  /** total pages in the document, drives gutter width */
  pageCount: number;
}

export interface TemplateDef {
  id: string;
  name: string;
  category: 'interior' | 'planner' | 'puzzle' | 'school';
  accessLevel: 'free' | 'ad_unlock' | 'premium_only';
  /** SVG preview markup for the card (viewBox 0 0 100 141) */
  preview: string;
  /** true when the layout should sit inside the KDP safe area */
  kdpSafe?: boolean;
  build: (ctx: TemplateContext) => Promise<fabric.FabricObject[]>;
  description?: string;
  /** Siblings (thin / wide / bold) hide behind one gallery card. */
  variantGroup?: string;
  variantLabel?: string;
  /** Left/right pair. Badge + apply rule only — do not invent pair art. */
  pairGroup?: string;
  pairSide?: 'left' | 'right';
  /** Journals / lines: user may recolor lines in preview. */
  lineColorable?: boolean;
}
