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
import { DestRow, GenerateBar, GenDrawer, GenMore } from '../shared/GenerateBar';
import { usePuzzlePreview } from '../shared/usePuzzlePreview';
import { crosswordPreviewData } from '../shared/preview-builders';
import { clearPuzzlePreview } from '../shared/puzzle-preview';
import { toggleLevel } from '../shared/puzzle-utils';

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

  const [levels, setLevels] = useState<CWDifficulty[]>(['medium']);
  const level = levels[0] ?? 'medium';
  const [count, setCount] = useState(20);
  const [destination, setDestination] = useState<PuzzleDestination>('append');
  const [replace, setReplace] = useState(true);
  const [bankIds, setBankIds] = useState<string[]>(['animals']);
  const [customList, setCustomList] = useState('');
  const [useCustom, setUseCustom] = useState(true);

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
    async () => {
      await loadFont(style.fontFamily);
      return crosswordPreviewData(
        themes.flatMap((t) => t.words),
        level,
        style,
        layout,
        { width: genPage.width, height: genPage.height },
        bookTitle,
      );
    },
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
        difficulties: levels,
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
      <div className="panel-body set-body gen-form">
        <textarea
          value={customList}
          onChange={(e) => {
            setCustomList(e.target.value);
            setUseCustom(true);
          }}
          placeholder={'ANSWER - clue\nor just a word'}
          rows={4}
          disabled={busy}
          aria-label="Your words and clues"
        />
        {customJunk && (
          <p className="set-meta">Junk dropped. Need 2–15 letters.</p>
        )}
        <GenDrawer label={useCustom ? 'Themes' : `Theme · ${CLUE_BANKS.find((b) => bankIds.includes(b.id))?.name ?? 'Themes'}`}>
          <div className="chips">
            {CLUE_BANKS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`chip ${!useCustom && bankIds.includes(b.id) ? 'active' : ''}`}
                onClick={() => {
                  setUseCustom(false);
                  toggleBank(b.id);
                }}
                disabled={busy}
              >
                {b.name}
              </button>
            ))}
          </div>
        </GenDrawer>
        <div className="set-row">
          <span>Level</span>
          <div className="chips">
            {DIFFS.map((d) => (
              <button
                key={d.v}
                type="button"
                className={`chip ${levels.includes(d.v) ? 'active' : ''}`}
                onClick={() => setLevels((cur) => toggleLevel(cur, d.v))}
                disabled={busy}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <label className="set-row">
          <span>Count</span>
          <input
            type="number" min={1} max={300} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
            disabled={busy}
            aria-label="How many crosswords"
          />
        </label>

        <GenMore>
          <button
            type="button"
            className="ink-quiet-btn ghost"
            onClick={() => browseGeneratorTemplates('crossword')}
            disabled={busy}
          >
            Templates
          </button>
          <label className="set-row">
            <span>Title</span>
            <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} disabled={busy} />
          </label>
          <label className="set-row">
            <span>Font</span>
            <select
              value={style.fontFamily}
              onChange={(e) => setStyle((s) => ({ ...s, fontFamily: e.target.value }))}
            >
              {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>
          </label>
          <label className="toggle-row">
            <span>Show number</span>
            <input
              type="checkbox"
              checked={style.showTitle}
              onChange={(e) => setStyle((s) => ({ ...s, showTitle: e.target.checked }))}
            />
          </label>
          <label className="toggle-row">
            <span>Show difficulty</span>
            <input
              type="checkbox"
              checked={style.showDifficulty}
              onChange={(e) => setStyle((s) => ({ ...s, showDifficulty: e.target.checked }))}
            />
          </label>
          <div className="set-row">
            <span>Solver</span>
            <div className="chips">
              {CONTENT_MODES.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  className={`chip ${layout.contentMode === m.v ? 'active' : ''}`}
                  onClick={() => set('contentMode', m.v)}
                  disabled={busy}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="set-row">
            <span>Answers</span>
            <div className="chips">
              {([['back_of_book', 'Back'], ['next_page', 'After'], ['none', 'None']] as [CwSolutionPlacement, string][]).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${layout.solutionPlacement === v ? 'active' : ''}`}
                  onClick={() => set('solutionPlacement', v)}
                  disabled={busy}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {layout.solutionPlacement === 'back_of_book' && (
            <div className="set-row">
              <span>Per page</span>
              <div className="chips">
                {solPerPageChoices.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${layout.solutionsPerPage === n ? 'active' : ''}`}
                    onClick={() => set('solutionsPerPage', n)}
                    disabled={busy}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="set-row">
            <span>Cells</span>
            <input
              type="range" min={0.2} max={3} step={0.1}
              value={style.gridLineWidth}
              onChange={(e) => setStyle((s) => ({ ...s, gridLineWidth: Number(e.target.value) }))}
              aria-label="Cell line width"
            />
            <input type="color" value={style.gridLineColor} onChange={(e) => setStyle((s) => ({ ...s, gridLineColor: e.target.value }))} aria-label="Cell colour" />
          </label>
          <label className="set-row">
            <span>Ticks</span>
            <input
              type="range" min={0.15} max={0.5} step={0.01}
              value={style.numberScale}
              onChange={(e) => setStyle((s) => ({ ...s, numberScale: Number(e.target.value) }))}
              aria-label="Clue number size"
            />
            <input type="color" value={style.numberColor} onChange={(e) => setStyle((s) => ({ ...s, numberColor: e.target.value }))} aria-label="Tick colour" />
          </label>
          <label className="set-row">
            <span>Space</span>
            <input
              type="range" min={-40} max={200} step={10}
              value={style.letterSpacing}
              onChange={(e) => setStyle((s) => ({ ...s, letterSpacing: Number(e.target.value) }))}
              aria-label="Letter spacing"
            />
          </label>
          <DestRow
            destination={destination}
            onDestination={setDestination}
            replace={replace}
            onReplace={setReplace}
            busy={busy}
          />
        </GenMore>

        {busy && (
          <div className="stack">
            <div className="progress">
              <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 5}%` }} />
            </div>
            <p className="set-meta">{progress.done} / {progress.total}</p>
            <button type="button" className="ink-quiet-btn ghost" onClick={cancel}>Cancel</button>
          </div>
        )}

        <GenerateBar
          onGenerate={generate}
          busy={busy}
          disabled={!canGenerate}
          estPages={estPages}
        />
        {!canGenerate && !busy && (
          <p className="set-meta">Type four answers, or pick a theme.</p>
        )}
      </div>
    </div>
  );
}
