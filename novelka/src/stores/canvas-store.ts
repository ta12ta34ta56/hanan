import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { engine } from '../engine/canvas-engine';
import { PAGE_SIZES, isCover, isInterior, type Page, type ProjectFile } from '../types/canvas.types';
import { refitInteriorPages, refitSerializedObject } from '../services/safe-reflow';
import {
  DEFAULT_BOOK,
  buildCoverObjects,
  coverSpecFor,
  inferBookSettings,
  interiorPaperFill,
  syncCoverPage,
  type BookSettings,
} from '../services/book';
import { useToastStore } from './toast-store';

const MAX_HISTORY = 60;

/** Default cover page background — dark gray so white title text reads.
 *  Owner: not the light #f3f4f6 plate. */
const COVER_BG = '#2a2f38';

/** Cover is always first and never mixed into interior reorder. */
function withCoverPinned(pages: Page[]): Page[] {
  const cover = pages.find(isCover);
  if (!cover) return pages;
  return [cover, ...pages.filter((p) => !isCover(p))];
}

async function objectsToJSON(width: number, height: number, objects: unknown[]) {
  const fabricNs = await import('fabric');
  const el = document.createElement('canvas');
  const tmp = new fabricNs.StaticCanvas(el, { width, height });
  (objects as import('fabric').FabricObject[]).forEach((o) => tmp.add(o));
  const json = tmp.toObject(['id', 'elementType', 'name', 'locked']) as {
    objects: unknown[];
  };
  tmp.dispose();
  return json.objects;
}

/**
 * Every history entry is a full-book snapshot (all pages + settings + active
 * page). This is the only shape that makes undo/redo correct for BOTH object
 * edits and structural operations: undoing an "add page" always rolls back the
 * whole page array, never just the active page's objects.
 */
interface HistoryEntry {
  label: string;
  activePageId: string;
  pages: Page[];
  book: BookSettings;
  at: number;
}

interface CanvasState {
  projectName: string;
  pages: Page[];
  activePageId: string;
  /** Book-level print settings: trim / paper / binding. Cover geometry is
   *  DERIVED from these + the interior page count — see services/book.ts. */
  book: BookSettings;
  /** One-step undo for book-level operations (resize / paper / binding). */
  bookSnapshot: { pages: Page[]; book: BookSettings; label: string } | null;
  // history
  past: HistoryEntry[];
  future: HistoryEntry[];

  // actions
  setProjectName: (n: string) => void;
  activePage: () => Page;
  addPage: (size?: { width: number; height: number }) => Promise<void>;
  insertPageAt: (index: number) => Promise<void>;
  duplicatePage: (id: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  movePage: (from: number, to: number) => void;
  gotoPage: (id: string) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  firstPage: () => Promise<void>;
  lastPage: () => Promise<void>;
  syncActivePage: () => void;
  setPageSize: (w: number, h: number) => void;
  setPageBackground: (c: string | null) => void;

  commit: (label?: string) => void;
  /** Push ONE full-book history record BEFORE a page-level mutation. Engine
   *  edits go through `commit` (per-page object snapshot); structural changes
   *  (pages/book) must snapshot the whole book so undo/redo work everywhere. */
  pushBook: (label: string) => void;
  /** Restore a history snapshot and repaint the canvas/selection. */
  restoreSnapshot: (entry: HistoryEntry) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  jumpToHistory: (index: number) => Promise<void>;


  importPages: (incoming: Page[], mode: 'append' | 'replace') => Promise<void>;
  replaceAllPages: (next: Page[]) => Promise<void>;
  appendPages: (incoming: Page[]) => Promise<void>;
  addCoverPage: (o: {
    name: string;
    width: number;
    height: number;
    objects: unknown[];
  }) => Promise<void>;
  addPagesBulk: (o: {
    count: number;
    where: 'end' | 'after' | 'start';
    source: 'blank' | 'copyCurrent';
    size: { width: number; height: number };
  }) => Promise<void>;
  applySelectionToAllPages: () => Promise<void>;
  serialize: () => ProjectFile;
  loadProject: (p: ProjectFile) => Promise<void>;
  newProject: () => Promise<void>;

  /** Create a whole book from the New Book setup window — one action. */
  newBook: (o: {
    name: string;
    settings: BookSettings;
    pageCount: number;
    includeCover: boolean;
  }) => Promise<void>;
  /** Recompute the cover's flat geometry from settings + interior count. */
  syncCover: () => Promise<void>;
  /** Book-level smart resize: all interiors + reflow + cover. */
  resizeBook: (next: BookSettings) => Promise<void>;
  /** Undo the last book-level operation (single step). */
  undoBookChange: () => Promise<void>;
}

function blankPage(index: number, size = PAGE_SIZES.A4): Page {
  return {
    id: nanoid(8),
    name: `Page ${index}`,
    width: size.width,
    height: size.height,
    background: '#ffffff',
    data: null,
  };
}

const INITIAL_PAGE = blankPage(1);

type SerializedObject = Record<string, unknown>;

function cloneSerializedObject(obj: SerializedObject): SerializedObject {
  const out = JSON.parse(JSON.stringify(obj)) as SerializedObject;
  const refresh = (node: SerializedObject) => {
    node.id = nanoid(8);
    const kids = node.objects;
    if (Array.isArray(kids)) {
      kids.forEach((kid) => {
        if (kid && typeof kid === 'object') refresh(kid as SerializedObject);
      });
    }
  };
  refresh(out);
  return out;
}

function clampSerializedObjectToPage(
  obj: SerializedObject,
  page: Page,
  pageNumber: number,
  pageCount: number,
): SerializedObject {
  if (page.role === 'cover') return obj;
  return refitSerializedObject(obj, page, pageNumber, pageCount);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  projectName: 'Untitled document',
  pages: [INITIAL_PAGE],
  activePageId: INITIAL_PAGE.id,
  book: { ...DEFAULT_BOOK },
  bookSnapshot: null,
  past: [],
  future: [],

  setProjectName: (n) => set({ projectName: n }),

  activePage: () => {
    const { pages, activePageId } = get();
    return pages.find((p) => p.id === activePageId) ?? pages[0];
  },

  syncActivePage: () => {
    if (!engine.canvas) return;
    const data = engine.toJSON() as Record<string, unknown>;
    set((s) => ({
      pages: s.pages.map((p) => {
        if (p.id !== s.activePageId) return p;
        // Fabric only serializes what it knows about, so carry over any custom
        // page-level keys (module metadata such as novelka:sudoku-page, instances, etc.).
        const prev = (p.data ?? {}) as Record<string, unknown>;
        const carried: Record<string, unknown> = {};
        for (const k of Object.keys(prev)) {
          if ((k.includes(':') || k === 'instances' || k === 'layoutResult' || k === 'layoutWarnings' || k === 'invalidForProduction' || k === 'ok') && !(k in data)) {
            carried[k] = prev[k];
          }
        }
        return { ...p, data: { ...data, ...carried } };
      }),
    }));
  },

  addPage: async (size) => {
    get().pushBook('Add page');
    const { pages } = get();
    const current = get().activePage();
    const interiorBase = isInterior(current) ? current : pages.find(isInterior) ?? current;
    const page = blankPage(pages.length + 1, {
      name: 'custom',
      width: size?.width ?? interiorBase.width,
      height: size?.height ?? interiorBase.height,
    });
    page.role = 'interior';
    page.background = interiorBase.background ?? interiorPaperFill(get().book.paper);
    set((s) => ({ pages: refitInteriorPages([...s.pages, page]) }));
    await get().gotoPage(page.id);
    useToastStore.getState().setStatus('success', 'Page added');
  },

  /** Insert a blank interior page after the given index (inline + affordance). */
  insertPageAt: async (index) => {
    get().pushBook('Insert page');
    const { pages, book } = get();
    const base = pages.find(isInterior) ?? { width: book.trimWidth, height: book.trimHeight };
    const page: Page = {
      ...blankPage(pages.length + 1, {
        name: 'custom',
        width: base.width,
        height: base.height,
      }),
      role: 'interior',
      background: ('background' in base ? base.background : null) ?? interiorPaperFill(book.paper),
    };
    const coverIdx = pages.findIndex(isCover);
    const at = coverIdx >= 0 && index < coverIdx ? coverIdx : index;
    set((s) => ({
      pages: refitInteriorPages(withCoverPinned([...s.pages.slice(0, at + 1), page, ...s.pages.slice(at + 1)])),
    }));
    await get().gotoPage(page.id);
    useToastStore.getState().setStatus('success', 'Page inserted');
  },

  duplicatePage: async (id) => {
    const src = get().pages.find((p) => p.id === id);
    if (!src) return;
    if (isCover(src)) {
      useToastStore.getState().setStatus('error', 'The cover cannot be duplicated');
      return;
    }
    get().pushBook('Duplicate page');
    const copy: Page = {
      ...src,
      id: nanoid(8),
      name: `${src.name} copy`,
      data: src.data ? JSON.parse(JSON.stringify(src.data)) : null,
    };
    const idx = get().pages.findIndex((p) => p.id === id);
    set((s) => ({ pages: refitInteriorPages([...s.pages.slice(0, idx + 1), copy, ...s.pages.slice(idx + 1)]) }));
    await get().gotoPage(copy.id);
  },

  deletePage: async (id) => {
    const { pages, activePageId } = get();
    if (pages.length === 1) {
      useToastStore.getState().setStatus('error', 'A document needs at least one page');
      return;
    }
    const idx = pages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    get().pushBook('Delete page');
    const next = refitInteriorPages(pages.filter((p) => p.id !== id));
    const target = next[Math.min(idx, next.length - 1)] ?? next[Math.max(0, idx - 1)];
    set({ pages: next });
    if (activePageId === id && target) {
      await get().gotoPage(target.id);
    } else if (engine.canvas) {
      const stay = next.find((p) => p.id === activePageId);
      if (stay && stay.role !== 'cover') {
        await engine.loadJSON(stay.data);
        engine.setBackground(stay.background);
      }
    }
  },

  movePage: (from, to) => {
    const { pages } = get();
    if (from === to || from < 0 || to < 0 || from >= pages.length || to >= pages.length) {
      return;
    }
    if (isCover(pages[from])) return;
    get().pushBook('Reorder pages');
    set((s) => {
      const next = [...s.pages];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { pages: refitInteriorPages(withCoverPinned(next)) };
    });
    const stay = get().pages.find((p) => p.id === get().activePageId);
    if (engine.canvas && stay && stay.role !== 'cover') {
      void engine.loadJSON(stay.data);
    }
  },

  gotoPage: async (id) => {
    const { activePageId } = get();
    if (activePageId === id && engine.canvas) return;
    get().syncActivePage();
    const page = get().pages.find((p) => p.id === id);
    if (!page) return;
    // Deliberately do NOT clear undo history here: navigating pages must not
    // destroy the ability to undo edits made on earlier pages.
    set({ activePageId: id });
    if (!engine.canvas) return; // editor not mounted yet — CanvasStage will sync
    engine.setPageSize(page.width, page.height);
    await engine.loadJSON(page.data);
    engine.setBackground(page.background);
  },

  nextPage: async () => {
    const { pages, activePageId } = get();
    const i = pages.findIndex((p) => p.id === activePageId);
    if (i < pages.length - 1) await get().gotoPage(pages[i + 1].id);
  },
  prevPage: async () => {
    const { pages, activePageId } = get();
    const i = pages.findIndex((p) => p.id === activePageId);
    if (i > 0) await get().gotoPage(pages[i - 1].id);
  },
  firstPage: async () => {
    const { pages } = get();
    if (pages.length) await get().gotoPage(pages[0].id);
  },
  lastPage: async () => {
    const { pages } = get();
    if (pages.length) await get().gotoPage(pages[pages.length - 1].id);
  },

  setPageSize: (w, h) => {
    const id = get().activePageId;
    const page = get().pages.find((p) => p.id === id);
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, width: w, height: h } : p)) }));
    // Keep the book's trim in step when a legacy flow resizes an interior
    // page directly (the Settings panel goes through resizeBook instead).
    if (page && isInterior(page)) {
      set((s) => ({ book: { ...s.book, trimWidth: w, trimHeight: h } }));
    }
    if (!engine.canvas) return;
    engine.setPageSize(w, h);
    get().commit('Page size changed');
  },

  setPageBackground: (color) => {
    const id = get().activePageId;
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, background: color } : p)) }));
    if (!engine.canvas) return;
    engine.setBackground(color);
    get().commit('Background changed');
  },

  // ------------------------------------------------------------- history
  /** Push a full-book snapshot onto the undo stack. Engine edits (called via
   *  the CanvasStage 'history' listener), page ops and book ops all funnel
   *  through here so undo/redo is consistent for every kind of change. */
  commit: (label = 'Edit') => {
    if (!engine.canvas) return;
    get().syncActivePage();
    const { pages, book, activePageId } = get();
    set((s) => ({
      past: [
        ...s.past,
        {
          label,
          activePageId,
          pages: JSON.parse(JSON.stringify(pages)) as Page[],
          book: JSON.parse(JSON.stringify(book)) as BookSettings,
          at: Date.now(),
        } as HistoryEntry,
      ].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  /** Alias of `commit` for structural operations (kept for call-site clarity). */
  pushBook: (label) => {
    get().commit(label);
  },

  /** Restore a snapshot (used by undo/redo/jump) and repaint the canvas. */
  restoreSnapshot: async (entry) => {
    const pages = JSON.parse(JSON.stringify(entry.pages)) as Page[];
    set({ pages, book: { ...entry.book }, activePageId: entry.activePageId });
    const page = pages.find((p) => p.id === entry.activePageId) ?? pages[0];
    if (engine.canvas) {
      engine.setPageSize(page.width, page.height);
      await engine.loadJSON(page.data);
      engine.setBackground(page.background);
    }
  },

  undo: async () => {
    const { past } = get();
    if (past.length < 2) return;
    const current = past[past.length - 1];
    const prev = past[past.length - 2];
    set({ past: past.slice(0, -1), future: [current, ...get().future] });
    await get().restoreSnapshot(prev);
    useToastStore.getState().setStatus('idle', `Undid ${current.label}`);
  },

  redo: async () => {
    const { future } = get();
    if (!future.length) return;
    const [next, ...rest] = future;
    set({ future: rest, past: [...get().past, next] });
    await get().restoreSnapshot(next);
    useToastStore.getState().setStatus('idle', `Redid ${next.label}`);
  },

  jumpToHistory: async (index) => {
    const { past } = get();
    if (index < 0 || index >= past.length) return;
    const target = past[index];
    const moved = past.slice(index + 1).reverse();
    set({ past: past.slice(0, index + 1), future: [...moved, ...get().future] });
    await get().restoreSnapshot(target);
  },

  importPages: async (incoming, mode) => {
    if (!incoming.length) return;
    get().syncActivePage();
    if (mode === 'replace') {
      set({ pages: refitInteriorPages(incoming), past: [], future: [] });
    } else {
      set((s) => ({ pages: refitInteriorPages([...s.pages, ...incoming]) }));
    }
    await get().gotoPage(incoming[0].id);
  },

  /** Create many pages at once — building a KDP interior one click at a time
   *  is the most tedious part of the job. */
  addPagesBulk: async ({ count, where, source, size }) => {
    get().pushBook('Add pages');
    const { pages, activePageId } = get();
    const current = pages.find((p) => p.id === activePageId) ?? pages[0];

    const template =
      source === 'copyCurrent' && current.data
        ? JSON.stringify(current.data)
        : null;

    // Never duplicate the cover — fall back to a blank interior page.
    const copying = source === 'copyCurrent' && isInterior(current);
    const made: Page[] = Array.from({ length: count }, () => ({
      id: nanoid(8),
      name: 'Page',
      role: 'interior' as const,
      width: copying ? current.width : size.width,
      height: copying ? current.height : size.height,
      background: copying ? current.background : interiorPaperFill(get().book.paper),
      data: copying && template ? JSON.parse(template) : null,
    }));

    const idx = pages.findIndex((p) => p.id === activePageId);
    const coverCount = pages.filter(isCover).length; // 0 or 1, always first
    let next: Page[];
    if (where === 'start') {
      // "start" means start of the interior, after the cover
      next = [...pages.slice(0, coverCount), ...made, ...pages.slice(coverCount)];
    } else if (where === 'after' && idx >= 0) {
      next = [...pages.slice(0, idx + 1), ...made, ...pages.slice(idx + 1)];
    } else {
      next = [...pages, ...made];
    }

    // renumber default names so the strip stays readable
    let n = 0;
    next = next.map((p) => {
      if (isCover(p)) return p;
      n += 1;
      return { ...p, name: /^Page( \d+)?$/.test(p.name) ? `Page ${n}` : p.name };
    });

    set({ pages: refitInteriorPages(withCoverPinned(next)) });
    await get().gotoPage(made[0].id);
  },

  /** Append module output (Sudoku etc.) and jump to the first new page. */
  appendPages: async (incoming) => {
    if (!incoming.length) return;
    get().pushBook('Add generated pages');
    set((s) => ({ pages: refitInteriorPages([...s.pages, ...incoming]) }));
    await get().gotoPage(incoming[0].id);
  },

  /** KDP covers are their own oversized page, inserted at the front. */
  addCoverPage: async ({ name, width, height, objects }) => {
    get().pushBook('Add cover');
    const serialized = await objectsToJSON(width, height, objects);

    const page: Page = {
      id: nanoid(8),
      name,
      width,
      height,
      background: COVER_BG,
      role: 'cover',
      data: { version: '6.0.0', background: COVER_BG, objects: serialized },
    };
    // A book has exactly one cover — replace any existing one rather than stack.
    set((s) => ({ pages: [page, ...s.pages.filter((p) => !isCover(p))] }));
    await get().gotoPage(page.id);
  },

  applySelectionToAllPages: async () => {
    get().pushBook('Apply selection to all pages');
    const selected = await engine.activeSelectionPageObjects();
    if (!selected.length) {
      useToastStore.getState().setStatus('error', 'Select an object first');
      return;
    }
    const { pages, activePageId } = get();
    const next = pages.map((page, index) => {
      // The cover is an isolated surface: interior "apply to all" never touches
      // it. Skip it outright.
      if (page.role === 'cover') return page;
      if (page.id === activePageId) return page;
      const base = page.data && typeof page.data === 'object'
        ? { ...(page.data as Record<string, unknown>) }
        : { version: '6.0.0', background: page.background ?? '#ffffff' };
      const existing = Array.isArray((base as { objects?: unknown[] }).objects)
        ? ([...(base as { objects: unknown[] }).objects] as unknown[])
        : [];
      const added = selected.map((obj) =>
        clampSerializedObjectToPage(
          cloneSerializedObject(obj),
          page,
          pages.slice(0, index + 1).filter((p) => p.role !== 'cover').length || 1,
          pages.filter((p) => p.role !== 'cover').length || 1,
        ),
      );
      return {
        ...page,
        data: {
          ...base,
          background: page.background ?? '#ffffff',
          objects: [...existing, ...added],
        },
      };
    });
    set({ pages: next });
    // Count only the interior pages the change actually reached (never the cover).
    const reached = next.filter(
      (p) => p.id !== activePageId && p.role !== 'cover',
    ).length;
    useToastStore.getState().setStatus('success', `Applied selection to ${reached} interior page${reached === 1 ? '' : 's'}`);
  },

  /** Swap the whole page array (template apply, page numbers, reflow, apply to
   *  all) and repaint. Pushes ONE full-book history record so these structural
   *  changes are undoable. Deliberately does not clear undo history. */
  replaceAllPages: async (next) => {
    if (!next.length) return;
    get().pushBook('Change book');
    const keep = get().activePageId;
    set({ pages: refitInteriorPages(next) });
    const still = next.some((p) => p.id === keep);
    const target = still ? keep : next[0].id;
    const page = next.find((p) => p.id === target)!;
    set({ activePageId: target });
    if (!engine.canvas) return;
    engine.setPageSize(page.width, page.height);
    await engine.loadJSON(page.data);
    engine.setBackground(page.background);
  },

  // ------------------------------------------------------------- project
  serialize: () => {
    get().syncActivePage();
    return {
      version: 1,
      name: get().projectName,
      pages: get().pages,
      book: { ...get().book },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  loadProject: async (p) => {
    set({
      projectName: p.name,
      pages: refitInteriorPages(p.pages),
      book: inferBookSettings(p),
      bookSnapshot: null,
      past: [],
      future: [],
    });
    await get().gotoPage(p.pages[0].id);
    useToastStore.getState().setStatus('success', 'Project loaded');
  },

  newProject: async () => {
    const page = blankPage(1);
    set({
      projectName: 'Untitled document',
      pages: [page],
      book: { ...DEFAULT_BOOK, trimWidth: page.width, trimHeight: page.height },
      bookSnapshot: null,
      past: [],
      future: [],
    });
    await get().gotoPage(page.id);
  },

  /**
   * Build a complete book from the setup window: N interior pages at the
   * chosen trim, plus (optionally) a flat cover whose geometry comes from
   * `calculateCover` via coverSpecFor. One action — the project starts fresh.
   */
  newBook: async ({ name, settings, pageCount, includeCover }) => {
    const size = { name: 'trim', width: settings.trimWidth, height: settings.trimHeight };
    const paperFill = interiorPaperFill(settings.paper);
    const interiors: Page[] = Array.from({ length: Math.max(1, pageCount) }, (_, i) => ({
      ...blankPage(i + 1, size),
      role: 'interior' as const,
      background: paperFill,
    }));

    let pages: Page[] = interiors;
    if (includeCover) {
      // Default cover artwork: dark fill + title / subtitle / author / blurb.
      // Guide lines stay DOM-only (CoverGuides) and never enter page.data.
      const spec = coverSpecFor(settings, interiors.length);
      const objs = buildCoverObjects(spec, {
        font: 'Inter',
        bgColor: COVER_BG,
        title: name.trim() || 'YOUR TITLE',
      });
      const serialized = await objectsToJSON(spec.totalWidth, spec.totalHeight, objs);
      const cover: Page = {
        id: nanoid(8),
        name: 'Cover',
        width: spec.totalWidth,
        height: spec.totalHeight,
        background: COVER_BG,
        role: 'cover',
        data: { version: '6.0.0', background: COVER_BG, objects: serialized },
      };
      pages = [cover, ...interiors];
    }

    set({
      projectName: name,
      pages,
      book: { ...settings },
      bookSnapshot: null,
      past: [],
      future: [],
    });
    await get().gotoPage(pages[0].id);
  },

  /**
   * The cover ADAPTS: whenever pages are added/removed (or settings change),
   * its flat width/spine is recomputed via calculateCover and ONLY the cover
   * page is resized — spine artwork recentres, interiors are untouched.
   */
  syncCover: async () => {
    const { pages, book, activePageId } = get();
    const { pages: next, changed, spec } = syncCoverPage(pages, book);
    if (!changed) return;
    set({ pages: next });
    const cover = next.find(isCover);
    if (cover && cover.id === activePageId && engine.canvas) {
      engine.setPageSize(cover.width, cover.height);
      await engine.loadJSON(cover.data);
      engine.setBackground(cover.background);
    }
    useToastStore
      .getState()
      .setStatus('idle', `Cover updated — spine ≈ ${spec.spineInches.toFixed(3)}"`);
  },

  /**
   * Smart resize: the WHOLE book, never one page. Interiors get the new trim,
   * generated content reflows through the modules' own layout code, the cover
   * is recomputed. Single snapshot for one-step undo.
   */
  resizeBook: async (next) => {
    get().syncActivePage();
    const before = {
      pages: get().pages,
      book: { ...get().book },
      label: 'Book settings change',
    };
    const trimChanged =
      Math.abs(next.trimWidth - before.book.trimWidth) > 0.5 ||
      Math.abs(next.trimHeight - before.book.trimHeight) > 0.5;

    if (!trimChanged) {
      get().pushBook('Book settings change');
      const fill = interiorPaperFill(next.paper);
      const paperChanged = before.book.paper !== next.paper;
      const pages = paperChanged
        ? get().pages.map((p) => (p.role === 'cover' ? p : { ...p, background: fill }))
        : get().pages;
      set({ book: { ...next }, pages, bookSnapshot: before });
      const active = pages.find((p) => p.id === get().activePageId);
      if (engine.canvas && active && active.role !== 'cover') {
        engine.setBackground(active.background);
      }
      await get().syncCover();
      return;
    }

    const { resizeBookPages } = await import('../services/book-resize');
    const resized = await resizeBookPages(get().pages, next);
    // replaceAllPages pushes the full-book snapshot (old pages + old book) and
    // swaps the page array; only then commit the new trim.
    await get().replaceAllPages(resized);
    set({ book: { ...next }, bookSnapshot: before });
    useToastStore
      .getState()
      .setStatus('success', 'Book resized — generated pages reflowed, cover recomputed');
  },

  undoBookChange: async () => {
    const snap = get().bookSnapshot;
    if (!snap) return;
    set({ book: { ...snap.book }, bookSnapshot: null });
    await get().replaceAllPages(snap.pages);
    useToastStore.getState().setStatus('idle', 'Book change undone');
  },
}));

const TEST_HOOKS =
  import.meta.env?.DEV || import.meta.env?.VITE_ENABLE_TEST_HOOKS === 'true';

// Test hook: lets the e2e suite drive the store directly.
if (typeof window !== 'undefined' && TEST_HOOKS) {
  (window as unknown as { __store: typeof useCanvasStore }).__store = useCanvasStore;
}
