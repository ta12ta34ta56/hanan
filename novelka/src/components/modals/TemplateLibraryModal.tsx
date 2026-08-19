import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  TEMPLATES,
  applyTemplate,
  buildTemplateJSON,
  type TemplateDef,
} from '../../services/templates';
import { familyBadge, groupTemplateCards, pickPairTemplate, type TemplateCard } from '../../services/template-groups';
import { RULINGS } from '../../services/rulings';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { openGeneratorTool, useGeneratorStore, type GeneratorId } from '../../stores/generator-store';
import { engine } from '../../engine/canvas-engine';
import { SUDOKU_TEMPLATES, type SudokuTemplate } from '../../modules/sudoku-maker/templates';
import { WS_TEMPLATES, type WsTemplate } from '../../modules/word-search/templates';
import { CW_TEMPLATES, type CwTemplate } from '../../modules/crossword/templates';
import { MZ_TEMPLATES, type MzTemplate } from '../../modules/maze/templates';
import { SafeSvgPreview } from '../SafeSvgPreview';
import { LinesPanel } from '../panels/LinesPanel';
import { Icon } from '../Icon';

/**
 * Template LIBRARY — a big, calm window. Templates only; generators are NOT
 * in here (they keep their own panel in the left rail). Application logic is
 * the exact same code path the old template panel used — this file is shell.
 */

type Scope = 'page' | 'all' | 'blank';
type Category = 'all' | 'interior' | 'planner' | 'puzzle' | 'school' | 'lines' | 'covers';
type PuzzleFilter = 'all' | 'sudoku' | 'wordsearch' | 'crossword' | 'maze';

type PuzzleTemplate = {
  key: string;
  id: string;
  name: string;
  description: string;
  preview: string;
  accessLevel: 'free' | 'ad_unlock' | 'premium_only';
  generator: Exclude<GeneratorId, 'handwriting'>;
  source: SudokuTemplate | WsTemplate | CwTemplate | MzTemplate;
};

const GENERATOR_TAG: Record<PuzzleTemplate['generator'], string> = {
  sudoku: 'Sudoku',
  wordsearch: 'Word Search',
  crossword: 'Crossword',
  maze: 'Maze',
};

const PUZZLE_TEMPLATES: PuzzleTemplate[] = [
  ...SUDOKU_TEMPLATES.map((t) => ({
    key: `sudoku:${t.id}`, id: t.id, name: t.name, description: t.description,
    preview: t.preview, accessLevel: t.accessLevel, generator: 'sudoku' as const, source: t,
  })),
  ...WS_TEMPLATES.map((t) => ({
    key: `wordsearch:${t.id}`, id: t.id, name: t.name, description: t.description,
    preview: t.preview, accessLevel: t.accessLevel, generator: 'wordsearch' as const, source: t,
  })),
  ...CW_TEMPLATES.map((t) => ({
    key: `crossword:${t.id}`, id: t.id, name: t.name, description: t.description,
    preview: t.preview, accessLevel: t.accessLevel, generator: 'crossword' as const, source: t,
  })),
  ...MZ_TEMPLATES.map((t) => ({
    key: `maze:${t.id}`, id: t.id, name: t.name, description: t.description,
    preview: t.preview, accessLevel: t.accessLevel, generator: 'maze' as const, source: t,
  })),
];

const PUZZLE_SUBFILTERS: { key: PuzzleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sudoku', label: 'Sudoku' },
  { key: 'wordsearch', label: 'Word Search' },
  { key: 'crossword', label: 'Crossword' },
  { key: 'maze', label: 'Mazes' },
];

/** Card preview that only mounts its SVG once scrolled near the viewport. */
function LazyPreview({ markup, root }: { markup: string; root: React.RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { root: root.current ?? null, rootMargin: '320px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, root]);

  return (
    <div ref={ref} className="tpl-lib-prev">
      {visible ? (
        <SafeSvgPreview
          viewBox="0 0 100 141"
          preserveAspectRatio="xMidYMid meet"
          markup={markup}
        />
      ) : (
        <div className="tpl-lib-skeleton" />
      )}
    </div>
  );
}

export function TemplateLibraryModal({
  onClose,
  onOpenCover,
}: {
  onClose: () => void;
  onOpenCover: () => void;
}) {
  const { pages, activePageId, replaceAllPages, commit } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const font = useTextStyleStore((s) => s.fontFamily);
  const templateBrowser = useGeneratorStore((s) => s.templateBrowser);

  const [cat, setCat] = useState<Category>('all');
  const [puzzleFilter, setPuzzleFilter] = useState<PuzzleFilter>('all');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('page');
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [folderKey, setFolderKey] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Opened via "browse puzzle templates" from a generator? Land on that filter.
  useEffect(() => {
    if (!templateBrowser) return;
    setCat('puzzle');
    setPuzzleFilter(templateBrowser.filter);
  }, [templateBrowser]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (folderKey) setFolderKey(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, folderKey]);

  const q = query.trim().toLowerCase();
  const matches = (name: string, description?: string) =>
    !q || name.toLowerCase().includes(q) || (description ?? '').toLowerCase().includes(q);

  const pageTemplates = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (cat === 'all' || t.category === cat) &&
          matches(t.name, t.description),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cat, q],
  );

  const pageCards = useMemo(() => groupTemplateCards(pageTemplates), [pageTemplates]);
  const folder = folderKey ? pageCards.find((c) => c.key === folderKey) ?? null : null;

  useEffect(() => {
    setFolderKey(null);
  }, [cat, q]);

  const puzzleTemplates = useMemo(
    () =>
      PUZZLE_TEMPLATES.filter(
        (t) =>
          (puzzleFilter === 'all' || t.generator === puzzleFilter) &&
          matches(t.name, t.description),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [puzzleFilter, q],
  );

  const categories: { key: Category; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: groupTemplateCards(TEMPLATES).length + PUZZLE_TEMPLATES.length + RULINGS.length + 1 },
    { key: 'interior', label: 'Interiors', count: groupTemplateCards(TEMPLATES.filter((t) => t.category === 'interior')).length },
    { key: 'planner', label: 'Planners', count: groupTemplateCards(TEMPLATES.filter((t) => t.category === 'planner')).length },
    { key: 'puzzle', label: 'Puzzles', count: PUZZLE_TEMPLATES.length },
    { key: 'lines', label: 'Lines & Grids', count: RULINGS.length },
    { key: 'school', label: 'School', count: groupTemplateCards(TEMPLATES.filter((t) => t.category === 'school')).length },
    { key: 'covers', label: 'Covers', count: 1 },
  ];

  /* ------------------------------------------------- existing apply logic */

  const applyToOne = async (t: TemplateDef) => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (pages[idx]?.role === 'cover') {
      setStatus('error', 'Templates are for interior pages. The cover is separate.');
      return false;
    }
    await applyTemplate(t, font, replace, {
      pageNumber: idx + 1,
      pageCount: pages.length,
    });
    commit(`Template: ${t.name}`);
    return true;
  };

  const applyToMany = async (t: TemplateDef, onlyBlank: boolean, mate?: TemplateDef) => {
    useCanvasStore.getState().syncActivePage();
    const current = useCanvasStore.getState().pages;
    const next = [];
    let interiorNo = 0;
    for (let i = 0; i < current.length; i++) {
      const page = current[i];
      if (page.role === 'cover') {
        next.push(page);
        continue;
      }
      const existing = ((page.data as { objects?: unknown[] } | null)?.objects ?? []) as unknown[];
      if (onlyBlank && existing.length > 0) {
        next.push(page);
        interiorNo += 1;
        continue;
      }
      const pick = mate ? pickPairTemplate(t, mate, interiorNo) : t;
      interiorNo += 1;
      const objs = await buildTemplateJSON(pick, {
        w: page.width,
        h: page.height,
        font,
        pageNumber: i + 1,
        pageCount: current.length,
      });
      next.push({
        ...page,
        data: {
          version: '6.0.0',
          background: page.background ?? '#ffffff',
          objects: replace ? objs : [...objs, ...existing],
        },
      });
    }
    await replaceAllPages(next);
  };

  const applyPair = async (left: TemplateDef, right?: TemplateDef) => {
    setBusy(true);
    try {
      setStatus('busy', `Filling the book with ${left.name}…`);
      await applyToMany(left, false, right);
      setStatus('success', 'Pair applied — left and right pages through the book');
      onClose();
    } catch {
      setStatus('error', 'Template failed to apply');
    } finally {
      setBusy(false);
    }
  };

  const use = async (t: TemplateDef) => {
    setBusy(true);
    try {
      if (scope === 'page') {
        setStatus('busy', `Applying ${t.name}…`);
        const ok = await applyToOne(t);
        if (!ok) return;
        setStatus('success', `${t.name} applied`);
      } else {
        const onlyBlank = scope === 'blank';
        setStatus('busy', `Applying ${t.name} to ${pages.length} pages…`);
        await applyToMany(t, onlyBlank);
        setStatus('success', `${t.name} applied to ${onlyBlank ? 'blank' : 'all'} pages`);
      }
      onClose();
    } catch {
      setStatus('error', 'Template failed to apply');
    } finally {
      setBusy(false);
    }
  };

  const applyPuzzleTemplate = async (t: PuzzleTemplate) => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    const page = pages[idx] ?? pages[0];
    if (page.role === 'cover') {
      setStatus('error', 'Generators are for interior pages. The cover is separate.');
      return;
    }
    setBusy(true);
    try {
      setStatus('busy', `Applying ${t.name}…`);
      const c = engine.requireCanvas();
      if (replace) c.remove(...c.getObjects());
      const common = {
        page,
        pageNumber: idx + 1,
        pageCount: pages.length,
        count: 1,
        font,
        kdpSafe: true,
        title: GENERATOR_TAG[t.generator],
        subtitle: t.name,
        folio: idx + 1,
        ink: '#111827',
        accent: '#2b7fb8',
      };
      const result =
        t.generator === 'sudoku'
          ? (t.source as SudokuTemplate).build({ ...common, gridSize: 9 })
          : t.generator === 'wordsearch'
            ? (t.source as WsTemplate).build({
                ...common, gridSize: 13, wordCount: 12, bankHeight: 80, theme: 'Preview',
              })
            : t.generator === 'crossword'
              ? (t.source as CwTemplate).build({
                  ...common, gridSize: 15, clueHeight: 120, theme: 'Preview', level: 'Medium',
                })
              : (t.source as MzTemplate).build({ ...common, difficulty: 'Medium' });
      engine.addObjects(result.chrome);
      commit(`Template: ${t.name}`);
      openGeneratorTool(t.generator, t.id);
      setStatus('success', `${t.name} applied — generator opened`);
      onClose();
    } catch {
      setStatus('error', 'Puzzle template failed to apply');
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------------------------------------- render */

  const pageCardButton = (
    t: TemplateDef,
    opts: { key: string; name: string; badge?: string | null; onClick: () => void; title?: string },
  ) => (
    <button
      key={opts.key}
      className="tpl-lib-card"
      onClick={opts.onClick}
      disabled={busy}
      title={opts.title ?? t.description ?? t.name}
    >
      <div className="tpl-lib-art">
        <LazyPreview markup={t.preview} root={gridRef} />
        {opts.badge && <span className={`tpl-lib-badge ${opts.badge === 'PAIR' ? 'pair' : ''}`}>{opts.badge}</span>}
        {t.kdpSafe && <span className="kdp-flag">KDP</span>}
      </div>
      <div className="tpl-lib-cap">
        <span className="tpl-lib-name">{opts.name}</span>
      </div>
    </button>
  );

  const openFamily = (card: TemplateCard<TemplateDef>) => {
    if (card.isPair || card.variants.length > 1) {
      setFolderKey(card.key);
      return;
    }
    void use(card.primary);
  };

  const renderFamilyCards = (cards: TemplateCard<TemplateDef>[]) =>
    cards.map((card) =>
      pageCardButton(card.primary, {
        key: card.key,
        name: card.name,
        badge: familyBadge(card),
        onClick: () => openFamily(card),
        title: card.primary.description ?? card.name,
      }),
    );

  const renderSiblingCards = (card: TemplateCard<TemplateDef>) =>
    card.variants.map((t) =>
      pageCardButton(t, {
        key: t.id,
        name: card.isPair ? (t.pairSide === 'right' ? 'Right page' : 'Left page') : (t.variantLabel ?? t.name),
        onClick: () => {
          if (card.isPair) void applyPair(card.primary, card.pairMate);
          else void use(t);
        },
        title: t.description ?? t.name,
      }),
    );

  const renderPuzzleCards = (items: PuzzleTemplate[]) =>
    items.map((t) => (
      <button
        key={t.key}
        className="tpl-lib-card"
        onClick={() => void applyPuzzleTemplate(t)}
        disabled={busy}
        title={t.description}
      >
        <div className="tpl-lib-art">
          <LazyPreview markup={t.preview} root={gridRef} />
          <span className="kdp-flag">KDP</span>
        </div>
        <div className="tpl-lib-cap">
          <span className="tpl-lib-name">{t.name}</span>
          <span className="tpl-lib-tag">{GENERATOR_TAG[t.generator]}</span>
        </div>
      </button>
    ));

  const coverCard = (
    <button
      key="cover-creator"
      className="tpl-lib-card"
      onClick={() => {
        onClose();
        onOpenCover();
      }}
      title="Design a full wraparound KDP cover with computed spine width"
    >
      <div className="tpl-lib-art">
        <div className="tpl-lib-prev tpl-lib-coverart">
          <Icon name="book" size={38} />
        </div>
        <span className="kdp-flag">KDP</span>
      </div>
      <div className="tpl-lib-cap">
        <span className="tpl-lib-name">Cover creation</span>
        <span className="tpl-lib-tag">Wizard</span>
      </div>
    </button>
  );

  let body: ReactNode;
  if (folder) {
    body = (
      <div>
        <div className="tpl-lib-folder-head">
          <button
            className="tpl-lib-back"
            onClick={() => setFolderKey(null)}
            aria-label="Back to templates"
            title="Back"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <div>
            <div className="tpl-lib-folder-title">{folder.name}</div>
            <p className="hint" style={{ margin: 0 }}>
              {folder.isPair
                ? 'Look at both pages. Select the pair and the book fills left / right by itself.'
                : 'Pick one sibling.'}
            </p>
          </div>
        </div>
        {folder.isPair && (
          <button
            className="btn primary"
            style={{ marginBottom: 14 }}
            onClick={() => void applyPair(folder.primary, folder.pairMate)}
            disabled={busy}
          >
            Use this pair
          </button>
        )}
        <div className="tpl-lib-grid">
          <button className="tpl-lib-card tpl-lib-backcard" onClick={() => setFolderKey(null)} aria-label="Back">
            <div className="tpl-lib-art tpl-lib-backart">
              <Icon name="chevron-left" size={28} />
            </div>
          </button>
          {renderSiblingCards(folder)}
        </div>
      </div>
    );
  } else if (cat === 'lines') {
    body = (
      <div className="tpl-lib-lines">
        <LinesPanel embedded />
      </div>
    );
  } else if (cat === 'covers') {
    body = <div className="tpl-lib-grid">{coverCard}</div>;
  } else if (cat === 'puzzle') {
    body = <div className="tpl-lib-grid">{renderPuzzleCards(puzzleTemplates)}</div>;
  } else if (cat === 'all') {
    body = (
      <div className="tpl-lib-grid">
        {renderFamilyCards(pageCards)}
        {renderPuzzleCards(puzzleTemplates)}
        {!q && coverCard}
      </div>
    );
  } else {
    body = <div className="tpl-lib-grid">{renderFamilyCards(pageCards)}</div>;
  }

  const empty =
    !folder &&
    cat !== 'lines' &&
    cat !== 'covers' &&
    ((cat === 'puzzle' && puzzleTemplates.length === 0) ||
      (cat !== 'puzzle' && cat !== 'all' && pageCards.length === 0) ||
      (cat === 'all' && pageCards.length + puzzleTemplates.length === 0));

  return (
    <>
      <div className="tpl-lib-overlay" onClick={onClose}>
        <div
          className="tpl-lib"
          role="dialog"
          aria-modal="true"
          aria-label="Template library"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tpl-lib-head">
            <span className="tpl-lib-title">Templates</span>
            <div className="tpl-lib-search">
              <Icon name="search" size={14} />
              <input
                placeholder="Search templates…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search templates"
                autoFocus
              />
            </div>
            <button className="btn icon" onClick={onClose} title="Close" aria-label="Close template library">
              <Icon name="close" size={15} />
            </button>
          </div>

          <div className="tpl-lib-body">
            <div className="tpl-lib-rail">
              {categories.map((c) => (
                <button
                  key={c.key}
                  className={`tpl-lib-cat ${cat === c.key ? 'active' : ''}`}
                  onClick={() => setCat(c.key)}
                >
                  <span>{c.label}</span>
                  <span className="tpl-lib-count">{c.count}</span>
                </button>
              ))}

              {cat === 'puzzle' && (
                <div className="tpl-lib-sub">
                  {PUZZLE_SUBFILTERS.map((g) => (
                    <button
                      key={g.key}
                      className={`tpl-lib-cat sub ${puzzleFilter === g.key ? 'active' : ''}`}
                      onClick={() => setPuzzleFilter(g.key)}
                    >
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="tpl-lib-railsec">
                <div className="section-title">Apply to</div>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as Scope)}
                  aria-label="Apply template to"
                >
                  <option value="page">This page</option>
                  <option value="all">All {pages.length} pages</option>
                  <option value="blank">Blank pages only</option>
                </select>
                <label className="toggle-row" style={{ marginTop: 8 }}>
                  <span>Replace content</span>
                  <input
                    type="checkbox"
                    checked={replace}
                    onChange={(e) => setReplace(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="tpl-lib-scroll" ref={gridRef}>
              {empty ? (
                <div className="empty" style={{ margin: 24 }}>
                  No templates match{q ? ` “${query}”` : ' these filters'}.
                </div>
              ) : (
                body
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
