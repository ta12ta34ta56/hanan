import { kdpMarginsFor, safeAreaFor, serializedObjectBounds } from './kdp';
import { interiorPageCount, interiorPageNumber } from './template-groups';

/**
 * When the book grows, KDP's gutter gets wider and the safe box shrinks.
 * Artwork that was legal at 24 pages sits in the gutter at 151+. This
 * file pulls every interior object back into the current safe box.
 *
 * Cover is never touched.
 */

type AnyObj = Record<string, unknown>;

export interface RefitablePage {
  role?: string;
  width: number;
  height: number;
  data: unknown;
}

function finite(n: unknown, fallback = 0): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function isVisible(o: AnyObj): boolean {
  return o.visible !== false && o.opacity !== 0;
}

/** Shrink + slide one serialized object into the given safe rectangle. */
export function refitSerializedObject(
  obj: AnyObj,
  page: { width: number; height: number },
  pageNumber: number,
  pageCount: number,
): AnyObj {
  if (!isVisible(obj)) return obj;
  const safe = safeAreaFor(
    page.width,
    page.height,
    pageNumber,
    kdpMarginsFor(Math.max(pageCount, 24)),
  );
  const next: AnyObj = { ...obj };
  let bb = serializedObjectBounds(next);
  const fullPageArt = bb.width >= page.width * 0.95 && bb.height >= page.height * 0.95;
  if (fullPageArt) return obj;

  const ratio = Math.min(
    safe.width / Math.max(bb.width, 1),
    safe.height / Math.max(bb.height, 1),
    1,
  );
  if (ratio < 1) {
    next.scaleX = finite(next.scaleX, 1) * ratio;
    next.scaleY = finite(next.scaleY, 1) * ratio;
    bb = serializedObjectBounds(next);
  }

  let dx = 0;
  let dy = 0;
  if (bb.left < safe.left) dx = safe.left - bb.left;
  else if (bb.left + bb.width > safe.left + safe.width) {
    dx = safe.left + safe.width - (bb.left + bb.width);
  }
  if (bb.top < safe.top) dy = safe.top - bb.top;
  else if (bb.top + bb.height > safe.top + safe.height) {
    dy = safe.top + safe.height - (bb.top + bb.height);
  }
  if (dx || dy) {
    next.left = finite(next.left) + dx;
    next.top = finite(next.top) + dy;
  }
  return next;
}

/** Refit every interior page to the book's current gutter / safe box. */
export function refitInteriorPages<T extends RefitablePage>(pages: T[]): T[] {
  const count = interiorPageCount(pages);
  return pages.map((page, i) => {
    if (page.role === 'cover') return page;
    const data = page.data as { objects?: unknown[] } | null;
    if (!data || !Array.isArray(data.objects) || data.objects.length === 0) return page;
    const pageNumber = interiorPageNumber(pages, i);
    const objects = data.objects.map((raw) => {
      if (!raw || typeof raw !== 'object') return raw;
      return refitSerializedObject(
        raw as AnyObj,
        { width: page.width, height: page.height },
        pageNumber,
        count,
      );
    });
    return { ...page, data: { ...data, objects } };
  });
}
