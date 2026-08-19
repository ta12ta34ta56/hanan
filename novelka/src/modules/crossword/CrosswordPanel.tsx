import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { browseGeneratorTemplates, useGeneratorStore } from '../../stores/generator-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { FONTS, loadFont } from '../../engine/font-manager';
import {
  cleanWord,
  parseClueList,
  type CWDifficulty,
  type CrosswordPuzzle,
} from './generator';
import { CLUE_BANKS } from './clue-banks';
import {
  DEFAULT_CW_STYLE,
  suggestCwSolutionsPerPage,
  type CrosswordStyle,
} from './renderer';
import {
  DEFAULT_CW_LAYOUT,
  buildCrosswordPages,
  type CwContentMode,
  type CwLayoutOptions,
  type CwSolutionPlacement,
} from './build-pages';
import type { CwWorkerRequest, CwWorkerResponse } from './worker';
import { CW_TEMPLATES } from './templates';
import { generationPage } from '../shared/placement';
import {
  applyGeneratedPages,
  densityFromTemplate,
  generatePlacement,
  type PuzzleDestination,
} from '../shared/destination';
import { GenerateBar } from '../shared/GenerateBar';
import { usePuzzlePreview } from '../shared/usePuzzlePreview';
import { crosswordPreviewData } from '../shared/preview-builders';
import { clearPuzzlePreview } from '../shared/puzzle-preview';

const DIFFS: { v: CWDifficulty; label: string }[] = [
  { v: 'easy', label: 'Easy' },
  { v: 'medium', label: 'Medium' },
  { v: 'hard', label: 'Hard' },
  { v: 'expert', label: 'Expert' },
];

const CONTENT_MODES: { v: CwContentMode; label: string }[] = [
  { v: 'clues', label: 'Clues' },
  { v: 'words', label: 'Words' },
  { v: 'both', label: 'Both' },
];

function usableClues(raw: string) {
  return parseClueList(raw).filter((w) => {
    const key = cleanWord(w.word);
    return key.length >= 2 && key.length <= 15;
  });
}

export function CrosswordPanel() {
  const { pages, activePageId, replaceAllPages, gotoPage } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const docFont = useTextStyleStore((s) => s.fontFamily);
  const genPage = generationPage(pages, activePageId);

  const [level, setLevel] = useState<CWDifficulty>('medium');
  const [count, setCount] = useState(20);
  const [destination, setDestination] = useState<PuzzleDestination>('append');
  const [replace, setReplace] = useState(true);
  const [bankIds, setBankIds] = useState<string[]>(['animals']);
  const [customList, setCustomList] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const [layout, setLayout] = useState<CwLayoutOptions>(DEFAULT_CW_LAYOUT);
  const deepLinkedTemplateId = useGeneratorStore((st) => st.templates.crossword);
  const [bookTitle, setBookTitle] = useState('Crossword');
  const [style, setStyle] = useState<CrosswordStyle>({
    ...DEFAULT_CW_STYLE,
    fontFamily: docFont,
    blockStyle: 'none',
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
    const tpl = CW_TEMPLATES.find((t) => t.id === layout.templateId);
    const n = densityFromTemplate(tpl?.supports);
    setLayout((l) => (l.puzzlesPerPage === n ? l : { ...l, puzzlesPerPage: n }));
  }, [layout.templateId]);

  const themes = useMemo(() => {
    if (useCustom) {
      const words = usableClues(customList);
      return words.length ? [{ name: bookTitle, words }] : [];
    }
    return CLUE_BANKS.filter((b) => bankIds.includes(b.id)).map((b) => ({
      name: b.name,
      words: b.words,
    }));
  }, [useCustom, customList, bankIds, bookTitle]);

  const totalWords = themes.reduce((s, t) => s + t.words.length, 0);

  const solPerPageChoices = useMemo(
    () => suggestCwSolutionsPerPage(genPage.width, genPage.height),
    [genPage.width, genPage.height],
  );

  useEffect(() => {
    setLayout((l) => ({
      ...l,
      solutionsPerPage: solPerPageChoices.includes(l.solutionsPerPage)
        ? l.solutionsPerPage
        : solPerPageChoices[Math.floor(solPerPageChoices.length / 2)] ?? 1,
    }));
  }, [solPerPageChoices]);

  const toggleBank = (id: string) =>
    setBankIds((cur) =>
      cur.includes(id) ? (cur.length > 1 ? cur.filter((x) => x !== id) : cur) : [...cur, id],
    );

  const estPages =
    count +
    (layout.solutionPlacement === 'none'
      ? 0
      : layout.solutionPlacement === 'next_page'
        ? count
        : Math.ceil(count / layout.solutionsPerPage));

  usePuzzlePreview(
    !busy,
    () => crosswordPreviewData(
      themes.flatMap((t) => t.words),
      level,
      style,
      layout,
      { width: genPage.width, height: genPage.height },
      bookTitle,
    ),
    { width: genPage.width, height: genPage.height },
    [level, style, layout.templateId, layout.contentMode, bookTitle, useCustom, customList, bankIds, genPage.width, genPage.height],
  );

  const canGenerate = themes.length > 0 && totalWords >= 4 && !busy;
  const customJunk = useCustom && parseClueList(customList).length > usableClues(customList).length;

  const generate = () => {
    if (!canGenerate) return;
    clearPuzzlePreview();
    setBusy(true);
    setProgress({ done: 0, total: count });
    setStatus('busy', `Generating ${count} crosswords…`);

    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent<CwWorkerResponse>) => {
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
        await place(msg.puzzles, msg.incomplete);
      } finally {
        setBusy(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    const req: CwWorkerRequest = {
      type: 'generate',
      options: {
        count,
        difficulties: [level],
        themes,
        wordsPerPuzzle: 0,
        gridSize: 0,
      },
    };
    worker.postMessage(req);
  };

  const place = async (puzzles: CrosswordPuzzle[], incomplete: number) => {
    const usable = puzzles.filter((p) => p.placements.length >= 4);
    if (!usable.length) {
      setStatus('error', 'That word list cannot build a crossword. Use at least four real words.');
      return;
    }
    const place = generatePlacement(useCanvasStore.getState().pages, destination, estPages);
    const built = buildCrosswordPages(
      usable,
      { ...style, blockStyle: 'none', hintStyle: layout.contentMode === 'words' ? 'words' : 'clues' },
      { ...layout, title: bookTitle },
      { width: genPage.width, height: genPage.height },
      place.startPageNumber,
      place.pageCount,
    );
    const applied = applyGeneratedPages({
      built: built.pages,
      current: useCanvasStore.getState().pages,
      destination,
      replace,
    });
    await replaceAllPages(applied.pages);
    if (applied.firstId) await gotoPage(applied.firstId);

    const bits = [
      `${usable.length} crosswords`,
      `${built.puzzlePageCount} puzzle page${built.puzzlePageCount === 1 ? '' : 's'}`,
    ];
    if (built.solutionPageCount) bits.push(`${built.solutionPageCount} answer pages`);
    const dropped = puzzles.length - usable.length;
    setStatus(
      'success',
      incomplete || dropped
        ? `${bits.join(' · ')} — ${incomplete + dropped} could not be built honestly`
        : bits.join(' · '),
    );
  };

  const cancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    setStatus('idle', 'Generation cancelled');
  };

  const set = <K extends keyof CwLayoutOptions>(k: K, v: CwLayoutOptions[K]) =>
    setLayout((l) => ({ ...l, [k]: v }));

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Crossword</span>
        <span className="badge">generator</span>
      </div>
      <div className="panel-body">
        <div className="section">
          <div className="section-title">Words &amp; clues</div>
          <div className="seg">
            <button className={!useCustom ? 'active' : ''} onClick={() => setUseCustom(false)} disabled={busy}>Theme</button>
            <button className={useCustom ? 'active' : ''} onClick={() => setUseCustom(true)} disabled={busy}>Own list</button>
          </div>
          {!useCustom ? (
            <div className="chips" style={{ marginTop: 8 }}>
              {CLUE_BANKS.map((b) => (
                <button key={b.id} className={`chip ${bankIds.includes(b.id) ? 'active' : ''}`} onClick={() => toggleBank(b.id)} disabled={busy} title={`${b.words.length} ready-written clues`}>
                  {bankIds.includes(b.id) ? '✓ ' : ''}{b.name}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={customList}
              onChange={(e) => setCustomList(e.target.value)}
              placeholder={'ANSWER - clue\nPLANET - or just a word'}
              rows={5}
              style={{ width: '100%', marginTop: 8, resize: 'vertical' }}
              disabled={busy}
            />
          )}
          {customJunk && (
            <p className="hint" style={{ color: 'var(--warn, #d08b3a)' }}>
              Junk words were dropped. Need 2–15 letters.
            </p>
          )}
        </div>

        <div className="section">
          <div className="section-title">How many puzzles</div>
          <div className="chips" style={{ marginBottom: 8 }}>
            {[10, 20, 30, 50, 100].map((n) => (
              <button key={n} className={`chip ${count === n ? 'active' : ''}`} onClick={() => setCount(n)} disabled={busy}>{n}</button>
            ))}
          </div>
          <input
            type="number" min={1} max={300} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
            disabled={busy}
            aria-label="How many crosswords"
          />
          <div className="section-title" style={{ marginTop: 12 }}>Difficulty</div>
          <div className="chips">
            {DIFFS.map((d) => (
              <button key={d.v} className={`chip ${level === d.v ? 'active' : ''}`} onClick={() => setLevel(d.v)} disabled={busy}>{d.label}</button>
            ))}
          </div>
        </div>

        <details className="section">
          <summary className="section-title">Advanced</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            <button
              className="btn primary"
              style={{ justifyContent: 'center' }}
              onClick={() => browseGeneratorTemplates('crossword')}
              disabled={busy}
            >
              Browse templates
            </button>
            <span className="label">Title</span>
            <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} disabled={busy} style={{ width: '100%' }} />
            <span className="label">Font</span>
            <select
              value={style.fontFamily}
              onChange={(e) => setStyle((s) => ({ ...s, fontFamily: e.target.value }))}
            >
              {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>

            <div className="section-title">What the solver gets</div>
            <div className="chips">
              {CONTENT_MODES.map((m) => (
                <button
                  key={m.v}
                  className={`chip ${layout.contentMode === m.v ? 'active' : ''}`}
                  onClick={() => set('contentMode', m.v)}
                  disabled={busy}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="section-title">Solutions</div>
            <div className="opt-grid">
              {([['back_of_book', 'Back of book'], ['next_page', 'After each'], ['none', 'No answers']] as [CwSolutionPlacement, string][]).map(([v, l]) => (
                <button key={v} className={`opt ${layout.solutionPlacement === v ? 'active' : ''}`} onClick={() => set('solutionPlacement', v)} disabled={busy}>
                  <div className="t">{l}</div>
                </button>
              ))}
            </div>
            {layout.solutionPlacement === 'back_of_book' && (
              <div className="chips" style={{ marginTop: 8 }}>
                {solPerPageChoices.map((n) => (
                  <button key={n} className={`chip ${layout.solutionsPerPage === n ? 'active' : ''}`} onClick={() => set('solutionsPerPage', n)} disabled={busy}>{n}</button>
                ))}
              </div>
            )}

            <div className="section-title">Preview look</div>
            <p className="hint">On the page now — not in the book until Generate.</p>
            <span className="label">Cell line — {style.gridLineWidth.toFixed(1)}pt</span>
            <input
              type="range" min={0.2} max={3} step={0.1}
              value={style.gridLineWidth}
              onChange={(e) => setStyle((s) => ({ ...s, gridLineWidth: Number(e.target.value) }))}
              aria-label="Cell line width"
            />
            <div className="row between">
              <span className="label" style={{ margin: 0 }}>Cells</span>
              <input type="color" value={style.gridLineColor} onChange={(e) => setStyle((s) => ({ ...s, gridLineColor: e.target.value }))} style={{ width: 50 }} />
            </div>
            <span className="label">Ticks — {Math.round(style.numberScale * 100)}%</span>
            <input
              type="range" min={0.15} max={0.5} step={0.01}
              value={style.numberScale}
              onChange={(e) => setStyle((s) => ({ ...s, numberScale: Number(e.target.value) }))}
              aria-label="Clue number size"
            />
            <div className="row between">
              <span className="label" style={{ margin: 0 }}>Ticks</span>
              <input type="color" value={style.numberColor} onChange={(e) => setStyle((s) => ({ ...s, numberColor: e.target.value }))} style={{ width: 50 }} />
            </div>
            <span className="label">Letter spacing — {style.letterSpacing}</span>
            <input
              type="range" min={-40} max={200} step={10}
              value={style.letterSpacing}
              onChange={(e) => setStyle((s) => ({ ...s, letterSpacing: Number(e.target.value) }))}
              aria-label="Letter spacing"
            />
          </div>
        </details>

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
          disabled={!canGenerate}
          estPages={estPages}
          hint="The grid is locked after Generate."
        />
        {!canGenerate && !busy && (
          <p className="hint" style={{ marginTop: 6 }}>
            Pick a theme or type at least four real answers first.
          </p>
        )}
      </div>
    </div>
  );
}
