import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  TEMPLATES,
  buildTemplateJSON,
  getTemplateThumbnail,
  type TemplateDef,
} from '../../services/templates';
import { groupTemplateCards, pickPairTemplate } from '../../services/template-groups';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { openGeneratorTool, useGeneratorStore, type GeneratorId } from '../../stores/generator-store';
import { SUDOKU_TEMPLATES } from '../../modules/sudoku-maker/templates';
import { WS_TEMPLATES } from '../../modules/word-search/templates';
import { CW_TEMPLATES } from '../../modules/crossword/templates';
import { MZ_TEMPLATES } from '../../modules/maze/templates';
import { HW_TEMPLATES, type HwTemplate } from '../../modules/handwriting/templates';
import { buildHandwritingPages, DEFAULT_HW_LAYOUT } from '../../modules/handwriting/build-pages';
import { DEFAULT_OPTIONS as HW_OPTS } from '../../modules/handwriting/generator';
import { DEFAULT_STYLE as HW_STYLE } from '../../modules/handwriting/renderer';
import { applyGeneratedPages, lockPuzzlePage, type PuzzleDestination } from '../../modules/shared/destination';
import { clearPuzzlePreview, showSerializedPreview } from '../../modules/shared/puzzle-preview';
import { generationPage } from '../../modules/shared/placement';
import { SafeSvgPreview } from '../SafeSvgPreview';
import { LinesPanel } from './LinesPanel';

function TemplateThumb({ t }: { t: TemplateDef }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    getTemplateThumbnail(t)
      .then((u) => { if (alive) setUrl(u); })
      .catch(() => { /* SVG fallback */ });
    return () => { alive = false; };
  }, [t]);
  if (url) return <img src={url} alt="" className="template-thumb" draggable={false} />;
  return <SafeSvgPreview viewBox="0 0 100 141" preserveAspectRatio="none" markup={t.preview} />;
}

type Scope = 'page' | 'all' | 'blank';
type TemplateFilter = 'all' | 'planner' | 'interior' | 'puzzle' | 'handwriting' | 'lines';
type PuzzleFilter = 'all' | 'sudoku' | 'wordsearch' | 'crossword' | 'maze';

type PuzzleTemplate = {
  key: string;
  id: string;
  name: string;
  description: string;
  preview: string;
  generator: Exclude<GeneratorId, 'handwriting'>;
};

const PUZZLE_TEMPLATE_GROUPS: { key: PuzzleFilter; label: string }[] = [
  { key: 'all', label: 'All puzzle templates' },
  { key: 'sudoku', label: 'Sudoku' },
  { key: 'wordsearch', label: 'Word Search' },
  { key: 'crossword', label: 'Crossword' },
  { key: 'maze', label: 'Mazes' },
];

const TEMPLATE_FILTERS: { key: TemplateFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'planner', label: 'Planners' },
  { key: 'interior', label: 'Interiors' },
  { key: 'puzzle', label: 'Puzzles' },
  { key: 'handwriting', label: 'Handwriting' },
  { key: 'lines', label: 'Lines & Grids' },
];

const PAGE_TEMPLATES = TEMPLATES.filter((t) => t.id !== 'cover-bold' && t.id !== 'puzzle-page');

const PUZZLE_TEMPLATES: PuzzleTemplate[] = [
  ...SUDOKU_TEMPLATES.filter((t) => t.id !== 'solutions').map((t) => ({
    key: `sudoku:${t.id}`, id: t.id, name: `Sudoku · ${t.name}`,
    description: t.description, preview: t.preview, generator: 'sudoku' as const,
  })),
  ...WS_TEMPLATES.filter((t) => !t.isSolution).map((t) => ({
    key: `wordsearch:${t.id}`, id: t.id, name: `Word Search · ${t.name}`,
    description: t.description, preview: t.preview, generator: 'wordsearch' as const,
  })),
  ...CW_TEMPLATES.filter((t) => !t.isSolution).map((t) => ({
    key: `crossword:${t.id}`, id: t.id, name: `Crossword · ${t.name}`,
    description: t.description, preview: t.preview, generator: 'crossword' as const,
  })),
  ...MZ_TEMPLATES.filter((t) => t.id !== 'answers').map((t) => ({
    key: `maze:${t.id}`, id: t.id, name: `Maze · ${t.name}`,
    description: t.description, preview: t.preview, generator: 'maze' as const,
  })),
];

const LINE_COLORS = ['#c9d1dc', '#9aa4b5', '#6b7280', '#111827', '#93c5fd', '#fca5a5', '#86efac'];
const RULE_FILLS = new Set(['#c9d1dc', '#dfe5ec', '#b9c2cf', '#9aa4b5']);

function recolorTemplateObjects(objs: unknown[], color: string): unknown[] {
  return objs.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const o = { ...(raw as Record<string, unknown>) };
    if (typeof o.stroke === 'string' && o.stroke !== 'transparent' && o.stroke !== 'none') o.stroke = color;
    if (typeof o.fill === 'string' && RULE_FILLS.has(o.fill.toLowerCase())) o.fill = color;
    if (Array.isArray(o.objects)) o.objects = recolorTemplateObjects(o.objects, color);
    return o;
  });
}

function isPageTemplateCategory(t: TemplateDef, cat: TemplateFilter): boolean {
  if (cat === 'interior') return t.category === 'interior' || t.category === 'school';
  return t.category === cat;
}

export function TemplatePanel() {
  const { pages, activePageId, replaceAllPages, gotoPage } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const font = useTextStyleStore((s) => s.fontFamily);
  const genPage = generationPage(pages, activePageId);

  const [cat, setCat] = useState<TemplateFilter>('all');
  const [puzzleFilter, setPuzzleFilter] = useState<PuzzleFilter>('all');
  const templateBrowser = useGeneratorStore((s) => s.templateBrowser);
  const [scope, setScope] = useState<Scope>('page');
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [variantPick, setVariantPick] = useState<string | null>(null);
  const [lineColor, setLineColor] = useState('#c9d1dc');

  const pageList = useMemo(
    () => (cat === 'all' ? PAGE_TEMPLATES : PAGE_TEMPLATES.filter((t) => isPageTemplateCategory(t, cat))),
    [cat],
  );
  const pageCards = useMemo(() => groupTemplateCards(pageList), [pageList]);

  const puzzleList = useMemo(
    () => (puzzleFilter === 'all' ? PUZZLE_TEMPLATES : PUZZLE_TEMPLATES.filter((t) => t.generator === puzzleFilter)),
    [puzzleFilter],
  );

  useEffect(() => {
    if (!templateBrowser) return;
    setCat('puzzle');
    setPuzzleFilter(templateBrowser.filter);
  }, [templateBrowser]);

  useEffect(() => () => { clearPuzzlePreview(); }, []);

  const previewing = PAGE_TEMPLATES.find((t) => t.id === (variantPick ?? previewId)) ?? null;

  const showPagePreview = async (t: TemplateDef) => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (pages[idx]?.role === 'cover') {
      const interior = pages.find((p) => p.role !== 'cover');
      if (interior) await gotoPage(interior.id);
      else {
        setStatus('error', 'Templates are for interior pages. The cover is separate.');
        return;
      }
    }
    setPreviewId(t.variantGroup ? t.variantGroup : t.id);
    setVariantPick(t.id);
    setBusy(true);
    try {
      const objs = await buildTemplateJSON(t, {
        w: genPage.width, h: genPage.height, font,
        pageNumber: Math.max(1, pages.findIndex((p) => p.id === activePageId) + 1),
        pageCount: pages.length,
      });
      const tinted = t.lineColorable ? recolorTemplateObjects(objs, lineColor) : objs;
      await showSerializedPreview({ objects: tinted }, { width: genPage.width, height: genPage.height });
      setStatus('idle', 'Preview — not in the book until Apply');
    } catch {
      setStatus('error', 'Could not preview that template');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!previewing?.lineColorable) return;
    void showPagePreview(previewing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineColor]);

  const applyPageTemplate = async (t: TemplateDef, mate?: TemplateDef) => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (pages[idx]?.role === 'cover' && scope === 'page') {
      setStatus('error', 'Templates are for interior pages. The cover is separate.');
      return;
    }
    setBusy(true);
    try {
      clearPuzzlePreview();
      useCanvasStore.getState().syncActivePage();
      const current = useCanvasStore.getState().pages;
      const next = [];
      let interiorNo = 0;
      let wrote = 0;
      for (let i = 0; i < current.length; i++) {
        const page = current[i];
        if (page.role === 'cover') { next.push(page); continue; }
        const existing = ((page.data as { objects?: unknown[] } | null)?.objects ?? []) as unknown[];
        const thisPage = scope === 'page' && page.id === current[idx]?.id;
        const take = scope === 'page' ? thisPage : scope === 'blank' ? existing.length === 0 : true;
        if (!take) { next.push(page); if (scope !== 'page') interiorNo += 1; continue; }
        const pick = scope === 'page' ? t : pickPairTemplate(t, mate, interiorNo);
        interiorNo += 1;
        const objs = await buildTemplateJSON(pick, {
          w: page.width, h: page.height, font, pageNumber: i + 1, pageCount: current.length,
        });
        const tinted = pick.lineColorable ? recolorTemplateObjects(objs, lineColor) : objs;
        next.push({
          ...page,
          data: {
            version: '6.0.0',
            background: page.background ?? '#ffffff',
            objects: replace ? tinted : [...tinted, ...existing],
          },
        });
        wrote += 1;
      }
      await replaceAllPages(next);
      setStatus('success', wrote ? `${t.name} applied` : 'No pages to apply that to');
      setPreviewId(null);
      setVariantPick(null);
    } catch {
      setStatus('error', 'Template failed to apply');
    } finally {
      setBusy(false);
    }
  };

  const openPuzzle = (t: PuzzleTemplate) => {
    clearPuzzlePreview();
    setPreviewId(null);
    setVariantPick(null);
    openGeneratorTool(t.generator, t.id);
    setStatus('idle', `${t.name} — set inputs, watch the preview, then Generate`);
  };

  const applyHandwriting = async (t: HwTemplate) => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (pages[idx]?.role === 'cover' && scope === 'page') {
      setStatus('error', 'Templates are for interior pages. The cover is separate.');
      return;
    }
    setBusy(true);
    try {
      clearPuzzlePreview();
      setStatus('busy', `Filling ${t.name}…`);
      const built = buildHandwritingPages(
        HW_OPTS,
        { ...DEFAULT_HW_LAYOUT, templateId: t.id },
        HW_STYLE,
        { width: genPage.width, height: genPage.height },
      );
      if (scope === 'page') {
        const current = useCanvasStore.getState().pages;
        const destPage = current[idx];
        if (!destPage || destPage.role === 'cover' || !built.pages[0]) {
          setStatus('error', 'Templates are for interior pages. The cover is separate.');
          return;
        }
        const first = lockPuzzlePage(built.pages[0]);
        const existing = ((destPage.data as { objects?: unknown[] } | null)?.objects ?? []) as unknown[];
        const incoming = ((first.data as { objects?: unknown[] } | null)?.objects ?? []) as unknown[];
        const next = current.map((p, i) => {
          if (i !== idx) return p;
          return {
            ...first,
            id: p.id,
            width: p.width,
            height: p.height,
            background: p.background ?? first.background,
            data: {
              ...(first.data as Record<string, unknown>),
              objects: replace ? incoming : [...incoming, ...existing],
            },
          };
        });
        await replaceAllPages(next);
        await gotoPage(destPage.id);
      } else {
        const dest: PuzzleDestination = scope === 'blank' ? 'blank' : 'all';
        const applied = applyGeneratedPages({
          built: built.pages,
          current: useCanvasStore.getState().pages,
          destination: dest,
          replace,
        });
        await replaceAllPages(applied.pages);
        if (applied.firstId) await gotoPage(applied.firstId);
      }
      setStatus('success', `${t.name} filled`);
      setPreviewId(null);
    } catch {
      setStatus('error', 'Handwriting template failed');
    } finally {
      setBusy(false);
    }
  };

  const previewHandwriting = async (t: HwTemplate) => {
    setBusy(true);
    try {
      const built = buildHandwritingPages(
        { ...HW_OPTS, only: ['A'] },
        { ...DEFAULT_HW_LAYOUT, templateId: t.id, showFolio: false },
        HW_STYLE,
        { width: genPage.width, height: genPage.height },
      );
      await showSerializedPreview(
        (built.pages[0]?.data ?? null) as { objects?: unknown[] } | null,
        { width: genPage.width, height: genPage.height },
      );
      setPreviewId(`hw:${t.id}`);
      setVariantPick(null);
      setStatus('idle', 'Preview — Apply fills the book');
    } catch {
      setStatus('error', 'Could not preview handwriting');
    } finally {
      setBusy(false);
    }
  };

  const renderPageCards = (items: TemplateDef[]) => {
    const cards = groupTemplateCards(items);
    return (
      <div className="grid-2">
        {cards.map((card) => {
          const active = card.variants.find((v) => v.id === variantPick) ?? card.primary;
          const open = previewId === card.key || previewId === card.primary.id || card.variants.some((v) => v.id === previewId);
          return (
            <div key={card.key} className="template-card-wrap">
              <button
                className={`template-card ${open ? 'is-preview' : ''}`}
                onClick={() => void showPagePreview(active)}
                disabled={busy}
                title={active.description ?? active.name}
              >
                <div className="prev">
                  <TemplateThumb t={active} />
                  {active.kdpSafe && <span className="kdp-flag">KDP</span>}
                  {card.variants.length > 1 && <span className="tpl-badge">Variants</span>}
                  {card.isPair && <span className="tpl-badge pair">Pair</span>}
                </div>
                <div className="cap">
                  {card.name}
                  <div style={{ fontSize: 9, color: 'var(--text-mute)' }}>{active.category}</div>
                </div>
              </button>
              {open && card.variants.length > 1 && (
                <div className="chips" style={{ marginTop: 6 }}>
                  {card.variants.map((v) => (
                    <button
                      key={v.id}
                      className={`chip ${variantPick === v.id ? 'active' : ''}`}
                      onClick={() => void showPagePreview(v)}
                    >
                      {v.variantLabel ?? v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPuzzleGrid = (items: PuzzleTemplate[]) => (
    <div className="grid-2">
      {items.map((t) => (
        <button
          key={t.key}
          className="template-card"
          onClick={() => openPuzzle(t)}
          disabled={busy}
          title={t.description}
        >
          <div className="prev">
            <SafeSvgPreview viewBox="0 0 100 141" preserveAspectRatio="none" markup={t.preview} />
            <span className="kdp-flag">KDP</span>
          </div>
          <div className="cap">
            {t.name}
            <div style={{ fontSize: 9, color: 'var(--text-mute)' }}>{t.generator}</div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderHandwriting = () => (
    <div className="grid-2">
      {HW_TEMPLATES.map((t) => (
        <button
          key={t.id}
          className={`template-card ${previewId === `hw:${t.id}` ? 'is-preview' : ''}`}
          onClick={() => void previewHandwriting(t)}
          onDoubleClick={() => void applyHandwriting(t)}
          disabled={busy}
          title={t.description}
        >
          <div className="prev">
            <SafeSvgPreview viewBox="0 0 100 141" preserveAspectRatio="none" markup={t.preview} />
          </div>
          <div className="cap">
            {t.name}
            <div style={{ fontSize: 9, color: 'var(--text-mute)' }}>{t.audience}</div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderSection = (title: string, body: ReactNode) => (
    <section className="section">
      <div className="section-title">{title}</div>
      {body}
    </section>
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Templates</span>
        <span className="badge">{pageCards.length}</span>
      </div>
      <div className="panel-body">
        <div className="section">
          <div className="section-title">Preview, then apply</div>
          <p className="hint" style={{ marginTop: -4 }}>
            Click a page template to preview it on the canvas. Apply writes it into the book.
            Puzzle templates open the generator instead.
          </p>
          <div className="opt-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <button className={`opt ${scope === 'page' ? 'active' : ''}`} onClick={() => setScope('page')}>
              <div className="t">This page</div>
            </button>
            <button className={`opt ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>
              <div className="t">All pages</div>
            </button>
            <button className={`opt ${scope === 'blank' ? 'active' : ''}`} onClick={() => setScope('blank')}>
              <div className="t">Blank only</div>
            </button>
          </div>
          <label className="toggle-row" style={{ marginTop: 8 }}>
            <span>Replace</span>
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          </label>
          {previewing?.lineColorable && (
            <>
              <span className="label" style={{ marginTop: 10 }}>Line color</span>
              <div className="swatches">
                {LINE_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${lineColor === c ? 'on' : ''}`}
                    style={{ background: c }}
                    onClick={() => setLineColor(c)}
                    aria-label={c}
                  />
                ))}
                <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} style={{ width: 26, height: 20, padding: 1 }} />
              </div>
            </>
          )}
          {previewing && (
            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => {
                const card = pageCards.find((c) => c.variants.some((v) => v.id === previewing.id));
                void applyPageTemplate(previewing, card?.pairMate);
              }}
              disabled={busy}
            >
              Apply {previewing.name}
            </button>
          )}
          {previewId?.startsWith('hw:') && (
            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => {
                const id = previewId.slice(3);
                const t = HW_TEMPLATES.find((h) => h.id === id);
                if (t) void applyHandwriting(t);
              }}
              disabled={busy}
            >
              Apply handwriting
            </button>
          )}
        </div>

        <div className="chips" style={{ marginBottom: 12 }}>
          {TEMPLATE_FILTERS.map((c) => (
            <button key={c.key} className={`chip ${cat === c.key ? 'active' : ''}`} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        {cat === 'puzzle' && (
          <div className="chips" style={{ marginBottom: 12 }}>
            {PUZZLE_TEMPLATE_GROUPS.map((g) => (
              <button key={g.key} className={`chip ${puzzleFilter === g.key ? 'active' : ''}`} onClick={() => setPuzzleFilter(g.key)}>
                {g.label}
              </button>
            ))}
          </div>
        )}

        {cat === 'all' ? (
          <>
            {renderSection('Planners', renderPageCards(PAGE_TEMPLATES.filter((t) => t.category === 'planner')))}
            {renderSection('Interiors', renderPageCards(PAGE_TEMPLATES.filter((t) => t.category === 'interior' || t.category === 'school')))}
            {renderSection('Puzzles', renderPuzzleGrid(PUZZLE_TEMPLATES))}
            {renderSection('Handwriting', renderHandwriting())}
            {renderSection('Lines & Grids', <LinesPanel embedded />)}
          </>
        ) : cat === 'puzzle' ? (
          renderPuzzleGrid(puzzleList)
        ) : cat === 'handwriting' ? (
          renderHandwriting()
        ) : cat === 'lines' ? (
          <LinesPanel embedded />
        ) : (
          renderPageCards(pageList)
        )}
      </div>
    </div>
  );
}