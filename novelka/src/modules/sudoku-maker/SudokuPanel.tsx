import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { browseGeneratorTemplates, useGeneratorStore } from '../../stores/generator-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { FONTS, loadFont } from '../../engine/font-manager';
import { type Difficulty, type GridSize, type SudokuPuzzle } from './generator';
import { DEFAULT_STYLE, suggestSolutionsPerPage, type SudokuStyle } from './renderer';
import {
  DEFAULT_LAYOUT,
  buildSudokuPages,
  type LayoutOptions,
  type SolutionPlacement,
} from './build-pages';
import type { WorkerRequest, WorkerResponse } from './worker';
import { SUDOKU_TEMPLATES } from './templates';
import { generationPage } from '../shared/placement';
import {
  applyGeneratedPages,
  densityFromTemplate,
  type PuzzleDestination,
} from '../shared/destination';
import { GenerateBar } from '../shared/GenerateBar';

const SIZES: { v: GridSize; label: string; note: string }[] = [
  { v: 4, label: '4 × 4', note: 'Kids' },
  { v: 9, label: '9 × 9', note: 'Classic' },
  { v: 16, label: '16 × 16', note: 'Advanced' },
];

const DIFFS: { v: Difficulty; label: string }[] = [
  { v: 'easy', label: 'Easy' },
  { v: 'medium', label: 'Medium' },
  { v: 'hard', label: 'Hard' },
  { v: 'expert', label: 'Expert' },
];

export function SudokuPanel() {
  const { pages, activePageId, replaceAllPages, gotoPage } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const docFont = useTextStyleStore((s) => s.fontFamily);
  const genPage = generationPage(pages, activePageId);

  const [size, setSize] = useState<GridSize>(9);
  const [level, setLevel] = useState<Difficulty>('medium');
  const [count, setCount] = useState(20);
  const [destination, setDestination] = useState<PuzzleDestination>('append');
  const [replace, setReplace] = useState(true);
  const [layout, setLayout] = useState<LayoutOptions>(DEFAULT_LAYOUT);
  const deepLinkedTemplateId = useGeneratorStore((st) => st.templates.sudoku);
  const [bookTitle, setBookTitle] = useState('Sudoku');
  const [style, setStyle] = useState<SudokuStyle>({
    ...DEFAULT_STYLE,
    fontFamily: docFont,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setStyle((s) => ({ ...s, fontFamily: docFont }));
  }, [docFont]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (deepLinkedTemplateId && layout.templateId !== deepLinkedTemplateId) {
      setLayout((l) => ({ ...l, templateId: deepLinkedTemplateId }));
    }
  }, [deepLinkedTemplateId, layout.templateId]);

  useEffect(() => {
    const tpl = SUDOKU_TEMPLATES.find((t) => t.id === layout.templateId);
    const n = densityFromTemplate(tpl?.supports);
    setLayout((l) => (l.puzzlesPerPage === n ? l : { ...l, puzzlesPerPage: n }));
  }, [layout.templateId]);

  const solPerPageChoices = useMemo(
    () => suggestSolutionsPerPage(size, genPage.width, genPage.height),
    [size, genPage.width, genPage.height],
  );

  useEffect(() => {
    setLayout((l) => ({
      ...l,
      solutionsPerPage: solPerPageChoices.includes(l.solutionsPerPage)
        ? l.solutionsPerPage
        : solPerPageChoices[Math.floor(solPerPageChoices.length / 2)] ?? 1,
    }));
  }, [solPerPageChoices]);

  const estPages =
    Math.ceil(count / layout.puzzlesPerPage) +
    (layout.solutionPlacement === 'none'
      ? 0
      : layout.solutionPlacement === 'next_page'
        ? Math.ceil(count / layout.puzzlesPerPage)
        : Math.ceil(count / layout.solutionsPerPage));

  const generate = () => {
    setBusy(true);
    setProgress({ done: 0, total: count });
    setStatus('busy', `Generating ${count} puzzles…`);

    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress({ done: msg.done, total: msg.total });
        return;
      }
      if (msg.type === 'error') {
        setStatus('error', msg.message);
        setBusy(false);
        worker.terminate();
        return;
      }
      try {
        await loadFont(style.fontFamily);
        await place(msg.puzzles, msg.degraded);
      } finally {
        setBusy(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    const req: WorkerRequest = {
      type: 'generate',
      options: { size, difficulties: [level], count, symmetric: true },
    };
    worker.postMessage(req);
  };

  const place = async (puzzles: SudokuPuzzle[], degraded: number) => {
    const built = buildSudokuPages(puzzles, style, { ...layout, title: bookTitle }, {
      width: genPage.width,
      height: genPage.height,
    });
    const applied = applyGeneratedPages({
      built: built.pages,
      current: useCanvasStore.getState().pages,
      destination,
      replace,
    });
    await replaceAllPages(applied.pages);
    if (applied.firstId) await gotoPage(applied.firstId);

    const bits = [
      `${puzzles.length} puzzles`,
      `${built.puzzlePageCount} puzzle page${built.puzzlePageCount === 1 ? '' : 's'}`,
    ];
    if (built.solutionPageCount) bits.push(`${built.solutionPageCount} solution pages`);
    setStatus(
      'success',
      degraded
        ? `${bits.join(' · ')} — ${degraded} were eased slightly to finish in time`
        : bits.join(' · '),
    );
  };

  const cancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    setStatus('idle', 'Generation cancelled');
  };

  const set = <K extends keyof LayoutOptions>(k: K, v: LayoutOptions[K]) =>
    setLayout((l) => ({ ...l, [k]: v }));
  const setSt = <K extends keyof SudokuStyle>(k: K, v: SudokuStyle[K]) =>
    setStyle((s) => ({ ...s, [k]: v }));

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Sudoku</span>
        <span className="badge">generator</span>
      </div>
      <div className="panel-body">
        <div className="section">
          <div className="section-title">Grid</div>
          <div className="opt-grid">
            {SIZES.map((s) => (
              <button
                key={s.v}
                className={`opt ${size === s.v ? 'active' : ''}`}
                onClick={() => setSize(s.v)}
                disabled={busy}
              >
                <div className="t">{s.label}</div>
                <div className="s">{s.note}</div>
              </button>
            ))}
          </div>
          <div className="section-title" style={{ marginTop: 12 }}>Difficulty</div>
          <div className="chips">
            {DIFFS.map((d) => (
              <button
                key={d.v}
                className={`chip ${level === d.v ? 'active' : ''}`}
                onClick={() => setLevel(d.v)}
                disabled={busy}
              >
                {d.label}
              </button>
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
          <input
            type="number"
            min={1}
            max={300}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
            disabled={busy}
            aria-label="How many puzzles"
          />
        </div>

        <details className="section">
          <summary className="section-title">Advanced</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            <button
              className="btn primary"
              style={{ justifyContent: 'center' }}
              onClick={() => browseGeneratorTemplates('sudoku')}
              disabled={busy}
            >
              Browse templates
            </button>
            <span className="label">Title</span>
            <input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} disabled={busy} style={{ width: '100%' }} />
            <span className="label">Font</span>
            <select
              value={style.fontFamily}
              onChange={(e) => setSt('fontFamily', e.target.value)}
            >
              {FONTS.map((f) => (
                <option key={f.family} value={f.family}>{f.label}</option>
              ))}
            </select>
            <label className="toggle-row">
              <span>Show puzzle number</span>
              <input
                type="checkbox"
                checked={style.showTitle}
                onChange={(e) => setSt('showTitle', e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              <span>Show puzzle difficulty</span>
              <input
                type="checkbox"
                checked={style.showDifficulty}
                onChange={(e) => setSt('showDifficulty', e.target.checked)}
              />
            </label>
            <div className="section-title">Solutions</div>
            <div className="opt-grid">
              {([
                ['back_of_book', 'Back of book'],
                ['next_page', 'After each'],
                ['none', 'No solutions'],
              ] as [SolutionPlacement, string][]).map(([v, l]) => (
                <button
                  key={v}
                  className={`opt ${layout.solutionPlacement === v ? 'active' : ''}`}
                  onClick={() => set('solutionPlacement', v)}
                  disabled={busy}
                >
                  <div className="t">{l}</div>
                </button>
              ))}
            </div>
            {layout.solutionPlacement === 'back_of_book' && (
              <>
                <span className="label">Solutions per page</span>
                <div className="chips">
                  {solPerPageChoices.map((n) => (
                    <button
                      key={n}
                      className={`chip ${layout.solutionsPerPage === n ? 'active' : ''}`}
                      onClick={() => set('solutionsPerPage', n)}
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
          <span className="label">Box border — {style.thickLineWidth.toFixed(1)}px</span>
          <input
            type="range" min={0.5} max={5} step={0.1}
            value={style.thickLineWidth}
            onChange={(e) => setSt('thickLineWidth', Number(e.target.value))}
            aria-label="Box border width"
          />
          <div className="row between" style={{ marginTop: 8 }}>
            <span className="label" style={{ margin: 0 }}>Border color</span>
            <input type="color" value={style.gridLineColor} onChange={(e) => setSt('gridLineColor', e.target.value)} style={{ width: 50 }} />
          </div>
          <span className="label">Numbers — {Math.round(style.fontScale * 100)}%</span>
          <input
            type="range" min={0.3} max={0.85} step={0.01}
            value={style.fontScale}
            onChange={(e) => setSt('fontScale', Number(e.target.value))}
            aria-label="Number size"
          />
          <div className="row between" style={{ marginTop: 8 }}>
            <span className="label" style={{ margin: 0 }}>Number color</span>
            <input type="color" value={style.numberColor} onChange={(e) => setSt('numberColor', e.target.value)} style={{ width: 50 }} />
          </div>
        </div>

        {busy && (
          <div className="section">
            <div className="progress">
              <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 5}%` }} />
            </div>
            <p className="hint" style={{ marginTop: 6 }}>
              Generated {progress.done} of {progress.total}…
            </p>
            <button className="btn sm danger" style={{ marginTop: 6 }} onClick={cancel}>
              Cancel
            </button>
          </div>
        )}

        <GenerateBar
          destination={destination}
          onDestination={setDestination}
          replace={replace}
          onReplace={setReplace}
          onGenerate={generate}
          busy={busy}
          estPages={estPages}
          hint="The grid is locked after Generate."
        />
      </div>
    </div>
  );
}
