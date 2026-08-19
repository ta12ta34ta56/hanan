import { useEffect, useMemo, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { browseGeneratorTemplates, useGeneratorStore } from '../../stores/generator-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { FONTS, loadFont } from '../../engine/font-manager';
import {
  DEFAULT_MAZE, generateMazes,
  type MazeDifficulty, type MazeOptions, type MazeShape,
} from './generator';
import { DEFAULT_MAZE_STYLE, type MarkerStyle, type MazeStyle } from './renderer';
import { MZ_TEMPLATES } from './templates';
import {
  DEFAULT_MZ_LAYOUT, buildMazePages, suggestMzSolutionsPerPage,
  type MzLayoutOptions, type MzSolutionPlacement,
} from './build-pages';
import { generationPage } from '../shared/placement';
import {
  applyGeneratedPages,
  densityFromTemplate,
  type PuzzleDestination,
} from '../shared/destination';
import { GenerateBar } from '../shared/GenerateBar';

const SHAPES: { v: MazeShape; label: string; note: string }[] = [
  { v: 'rectangular', label: 'Square', note: 'Classic' },
  { v: 'circular', label: 'Circle', note: 'Rings' },
  { v: 'hexagonal', label: 'Hexagon', note: 'Honeycomb' },
  { v: 'triangular', label: 'Triangle', note: 'Existing' },
];

const LEVELS: { v: MazeDifficulty; label: string }[] = [
  { v: 'easy', label: 'Easy' },
  { v: 'medium', label: 'Medium' },
  { v: 'hard', label: 'Hard' },
  { v: 'expert', label: 'Expert' },
];

const MARKERS: { v: MarkerStyle; label: string }[] = [
  { v: 'dot', label: 'Dots' },
  { v: 'arrow', label: 'Arrows' },
  { v: 'label', label: 'START / END' },
  { v: 'none', label: 'None' },
];

export function MazePanel() {
  const { pages, activePageId, replaceAllPages, gotoPage } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const docFont = useTextStyleStore((s) => s.fontFamily);
  const genPage = generationPage(pages, activePageId);

  const [opts, setOpts] = useState<MazeOptions>(DEFAULT_MAZE);
  const [count, setCount] = useState(20);
  const [destination, setDestination] = useState<PuzzleDestination>('append');
  const [replace, setReplace] = useState(true);
  const [layout, setLayout] = useState<MzLayoutOptions>(DEFAULT_MZ_LAYOUT);
  const deepLinkedTemplateId = useGeneratorStore((st) => st.templates.maze);
  const [style, setStyle] = useState<MazeStyle>({ ...DEFAULT_MAZE_STYLE, fontFamily: docFont });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStyle((s) => ({ ...s, fontFamily: docFont }));
  }, [docFont]);

  useEffect(() => {
    if (deepLinkedTemplateId && layout.templateId !== deepLinkedTemplateId) {
      setLayout((l) => ({ ...l, templateId: deepLinkedTemplateId }));
    }
  }, [deepLinkedTemplateId, layout.templateId]);

  useEffect(() => {
    const tpl = MZ_TEMPLATES.find((t) => t.id === layout.templateId);
    const n = densityFromTemplate(tpl?.supports);
    setLayout((l) => (l.mazesPerPage === n ? l : { ...l, mazesPerPage: n }));
  }, [layout.templateId]);

  const solChoices = useMemo(
    () => suggestMzSolutionsPerPage(genPage.width, genPage.height),
    [genPage.width, genPage.height],
  );

  useEffect(() => {
    setLayout((l) => ({
      ...l,
      solutionsPerPage: solChoices.includes(l.solutionsPerPage)
        ? l.solutionsPerPage
        : solChoices[solChoices.length - 1] ?? 1,
    }));
  }, [solChoices]);

  const estPages =
    Math.ceil(count / layout.mazesPerPage) +
    (layout.solutionPlacement === 'none'
      ? 0
      : layout.solutionPlacement === 'next_page'
        ? Math.ceil(count / layout.mazesPerPage)
        : Math.ceil(count / layout.solutionsPerPage));

  const generate = async () => {
    setBusy(true);
    setStatus('busy', `Building ${count} maze${count === 1 ? '' : 's'}…`);
    try {
      await loadFont(style.fontFamily);
      const mazes = generateMazes(opts, count);
      const { pages: built } = buildMazePages(
        mazes, layout, style,
        { width: genPage.width, height: genPage.height },
        1,
      );
      const applied = applyGeneratedPages({
        built,
        current: useCanvasStore.getState().pages,
        destination,
        replace,
      });
      await replaceAllPages(applied.pages);
      if (applied.firstId) await gotoPage(applied.firstId);
      setStatus('success', `${built.length} pages written`);
    } catch (e) {
      setStatus('error', e instanceof Error ? e.message : 'Could not build the mazes');
    } finally {
      setBusy(false);
    }
  };

  const set = <K extends keyof MazeOptions>(k: K, v: MazeOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));
  const setL = <K extends keyof MzLayoutOptions>(k: K, v: MzLayoutOptions[K]) =>
    setLayout((l) => ({ ...l, [k]: v }));

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Maze</span>
        <span className="badge">generator</span>
      </div>
      <div className="panel-body">
        <div className="section">
          <div className="section-title">Shape</div>
          <div className="opt-grid">
            {SHAPES.map((s) => (
              <button key={s.v} className={`opt ${opts.shape === s.v ? 'active' : ''}`} onClick={() => set('shape', s.v)} disabled={busy}>
                <div className="t">{s.label}</div>
                <div className="s">{s.note}</div>
              </button>
            ))}
          </div>
          <div className="section-title" style={{ marginTop: 12 }}>Difficulty</div>
          <div className="chips">
            {LEVELS.map((l) => (
              <button key={l.v} className={`chip ${opts.difficulty === l.v ? 'active' : ''}`} onClick={() => set('difficulty', l.v)} disabled={busy}>{l.label}</button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">How many puzzles</div>
          <div className="chips" style={{ marginBottom: 8 }}>
            {[10, 20, 30, 50, 100].map((n) => (
              <button key={n} className={`chip ${count === n ? 'active' : ''}`} onClick={() => setCount(n)} disabled={busy}>{n}</button>
            ))}
          </div>
          <input type="number" min={1} max={300} value={count} onChange={(e) => setCount(Math.max(1, Math.min(300, Number(e.target.value) || 1)))} disabled={busy} aria-label="How many mazes" />
        </div>

        <details className="section">
          <summary className="section-title">Advanced</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            <button
              className="btn primary"
              style={{ justifyContent: 'center' }}
              onClick={() => browseGeneratorTemplates('maze')}
              disabled={busy}
            >
              Browse templates
            </button>
            <span className="label">Title</span>
            <input value={layout.title} onChange={(e) => setL('title', e.target.value)} disabled={busy} style={{ width: '100%' }} />
            <span className="label">Font</span>
            <select value={style.fontFamily} onChange={(e) => setStyle((s) => ({ ...s, fontFamily: e.target.value }))}>
              {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>

            <div className="section-title">Start &amp; finish</div>
            <div className="chips">
              {MARKERS.map((m) => (
                <button
                  key={m.v}
                  className={`chip ${style.markers === m.v ? 'active' : ''}`}
                  onClick={() => setStyle((s) => ({ ...s, markers: m.v }))}
                  disabled={busy}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {opts.shape !== 'circular' && (
              <>
                <span className="label">Entrance</span>
                <div className="chips">
                  {(['top', 'bottom', 'left', 'right'] as const).map((s) => (
                    <button
                      key={s}
                      className={`chip ${opts.startsAt === s ? 'active' : ''}`}
                      onClick={() => set('startsAt', s)}
                      disabled={busy || opts.difficulty === 'expert'}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {opts.difficulty === 'expert' && (
                  <p className="hint">Expert places start and finish at the two furthest points.</p>
                )}
              </>
            )}

            <div className="section-title">Answers</div>
            <div className="opt-grid">
              {([
                ['back_of_book', 'Back of book'],
                ['next_page', 'After each'],
                ['none', 'No answers'],
              ] as [MzSolutionPlacement, string][]).map(([v, l]) => (
                <button
                  key={v}
                  className={`opt ${layout.solutionPlacement === v ? 'active' : ''}`}
                  onClick={() => setL('solutionPlacement', v)}
                  disabled={busy}
                >
                  <div className="t">{l}</div>
                </button>
              ))}
            </div>
            {layout.solutionPlacement === 'back_of_book' && (
              <>
                <span className="label">Answers per page</span>
                <div className="chips">
                  {solChoices.map((n) => (
                    <button
                      key={n}
                      className={`chip ${layout.solutionsPerPage === n ? 'active' : ''}`}
                      onClick={() => setL('solutionsPerPage', n)}
                      disabled={busy}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </details>

        <div className="section">
          <div className="section-title">Preview look</div>
          <div className="row between">
            <span className="label" style={{ margin: 0 }}>Walls</span>
            <input type="color" value={style.wallColor} onChange={(e) => setStyle((s) => ({ ...s, wallColor: e.target.value }))} style={{ width: 50 }} aria-label="Wall colour" />
          </div>
          <span className="label">Thickness — {style.wallWidth.toFixed(1)}pt</span>
          <input
            type="range" min={0.5} max={5} step={0.1}
            value={style.wallWidth}
            onChange={(e) => setStyle((s) => ({ ...s, wallWidth: Number(e.target.value) }))}
            aria-label="Wall width"
          />
        </div>

        <GenerateBar
          destination={destination}
          onDestination={setDestination}
          replace={replace}
          onReplace={setReplace}
          onGenerate={() => void generate()}
          busy={busy}
          estPages={estPages}
          hint="Maze walls are locked after Generate."
        />
      </div>
    </div>
  );
}
