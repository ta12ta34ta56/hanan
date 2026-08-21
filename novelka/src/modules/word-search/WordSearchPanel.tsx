import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { browseGeneratorTemplates, useGeneratorStore } from '../../stores/generator-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { FONTS, loadFont } from '../../engine/font-manager';
import {
  WS_PROFILES,
  cleanWord,
  minSizeFor,
  parseWordList,
  type DirectionId,
  type WSDifficulty,
  type WordSearchPuzzle,
} from './generator';
import { WORD_BANKS } from './word-banks';
import {
  DEFAULT_WS_STYLE,
  suggestWsSolutionsPerPage,
  type WordSearchStyle,
} from './renderer';
import {
  DEFAULT_WS_LAYOUT,
  buildWordSearchPages,
  type WsLayoutOptions,
  type WsSolutionPlacement,
} from './build-pages';
import type { WsWorkerRequest, WsWorkerResponse } from './worker';
import { WS_TEMPLATES } from './templates';
import { generationPage } from '../shared/placement';
import {
  applyGeneratedPages,
  densityFromTemplate,
  generatePlacement,
  type PuzzleDestination,
} from '../shared/destination';
import { DestRow, GenerateBar, GenDrawer, GenMore } from '../shared/GenerateBar';
import { usePuzzlePreview } from '../shared/usePuzzlePreview';
import { wordSearchPreviewData } from '../shared/preview-builders';
import { clearPuzzlePreview } from '../shared/puzzle-preview';
import { toggleLevel } from '../shared/puzzle-utils';

const DIFFS: { v: WSDifficulty; label: string }[] = [
  { v: 'easy', label: 'Easy' },
  { v: 'medium', label: 'Medium' },
  { v: 'hard', label: 'Hard' },
  { v: 'expert', label: 'Expert' },
];

const ALL_DIRS: { v: DirectionId; label: string }[] = [
  { v: 'E', label: '→ across' },
  { v: 'S', label: '↓ down' },
  { v: 'SE', label: '↘ diag' },
  { v: 'NE', label: '↗ diag' },
  { v: 'W', label: '← back' },
  { v: 'N', label: '↑ up' },
  { v: 'NW', label: '↖ diag' },
  { v: 'SW', label: '↙ diag' },
];

export function WordSearchPanel() {
  const { pages, activePageId, replaceAllPages, gotoPage } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const docFont = useTextStyleStore((s) => s.fontFamily);
  const genPage = generationPage(pages, activePageId);

  const [levels, setLevels] = useState<WSDifficulty[]>(['medium']);
  const level = levels[0] ?? 'medium';
  const [count, setCount] = useState(20);
  const [destination, setDestination] = useState<PuzzleDestination>('append');
  const [replace, setReplace] = useState(true);
  const [bankIds, setBankIds] = useState<string[]>(['animals']);
  const [customWords, setCustomWords] = useState('');
  const [useCustom, setUseCustom] = useState(true);
  const [dirOverride, setDirOverride] = useState<DirectionId[] | null>(null);
  const [secret, setSecret] = useState('');
  const [useSecret, setUseSecret] = useState(false);

  const [layout, setLayout] = useState<WsLayoutOptions>(DEFAULT_WS_LAYOUT);
  const deepLinkedTemplateId = useGeneratorStore((st) => st.templates.wordsearch);
  const [bookTitle, setBookTitle] = useState('Word Search');
  const [style, setStyle] = useState<WordSearchStyle>({
    ...DEFAULT_WS_STYLE,
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
    const tpl = WS_TEMPLATES.find((t) => t.id === layout.templateId);
    const n = densityFromTemplate(tpl?.supports);
    setLayout((l) => (l.puzzlesPerPage === n ? l : { ...l, puzzlesPerPage: n }));
  }, [layout.templateId]);

  const themes = useMemo(() => {
    if (useCustom) {
      const words = parseWordList(customWords).filter((w) => cleanWord(w).length >= 2);
      return words.length ? [{ name: bookTitle, words }] : [];
    }
    return WORD_BANKS.filter((b) => bankIds.includes(b.id)).map((b) => ({
      name: b.name,
      words: b.words,
    }));
  }, [useCustom, customWords, bankIds, bookTitle]);

  const totalWords = themes.reduce((s, t) => s + t.words.length, 0);
  const profile = WS_PROFILES[level];
  const effWords = profile.words;
  const effSize = Math.max(
    profile.size,
    minSizeFor(themes.flatMap((t) => t.words), effWords),
  );

  const solPerPageChoices = useMemo(
    () => suggestWsSolutionsPerPage(effSize, genPage.width, genPage.height),
    [effSize, genPage.width, genPage.height],
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
      cur.includes(id)
        ? cur.length > 1
          ? cur.filter((x) => x !== id)
          : cur
        : [...cur, id],
    );

  const toggleDir = (d: DirectionId) => {
    const base = dirOverride ?? [...profile.directions];
    const next = base.includes(d)
      ? base.length > 1
        ? base.filter((x) => x !== d)
        : base
      : [...base, d];
    setDirOverride(next);
  };
  const activeDirs = dirOverride ?? profile.directions;

  const estPages =
    Math.ceil(count / layout.puzzlesPerPage) +
    (layout.solutionPlacement === 'none'
      ? 0
      : layout.solutionPlacement === 'next_page'
        ? Math.ceil(count / layout.puzzlesPerPage)
        : Math.ceil(count / layout.solutionsPerPage));

  usePuzzlePreview(
    !busy,
    async () => {
      await loadFont(style.fontFamily);
      return wordSearchPreviewData(
        themes.flatMap((t) => t.words),
        level,
        dirOverride ?? undefined,
        style,
        layout,
        { width: genPage.width, height: genPage.height },
        bookTitle,
      );
    },
    { width: genPage.width, height: genPage.height },
    [level, style, layout.templateId, layout.puzzlesPerPage, bookTitle, useCustom, customWords, bankIds, dirOverride, genPage.width, genPage.height],
  );

  const canGenerate = themes.length > 0 && totalWords >= 4 && !busy;

  const generate = () => {
    if (!canGenerate) return;
    clearPuzzlePreview();
    setBusy(true);
    setProgress({ done: 0, total: count });
    setStatus('busy', `Generating ${count} word searches…`);

    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent<WsWorkerResponse>) => {
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

    const req: WsWorkerRequest = {
      type: 'generate',
      options: {
        count,
        difficulties: levels,
        themes,
        wordsPerPuzzle: 0,
        gridSize: 0,
        size: effSize,
        directions: dirOverride ?? undefined,
        allowOverlap: true,
        secretMessage: useSecret && secret.trim() ? secret : undefined,
      },
    };
    worker.postMessage(req);
  };

  const place = async (puzzles: WordSearchPuzzle[], incomplete: number) => {
    const place = generatePlacement(useCanvasStore.getState().pages, destination, estPages);
    const built = buildWordSearchPages(
      puzzles,
      style,
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
      `${puzzles.length} puzzles`,
      `${built.puzzlePageCount} puzzle page${built.puzzlePageCount === 1 ? '' : 's'}`,
    ];
    if (built.solutionPageCount) bits.push(`${built.solutionPageCount} answer pages`);

    const errorWarnings = built.warnings.filter((w) => w.severity === 'error');
    if (!built.ok || errorWarnings.length > 0) {
      const topCodes = [...new Set(errorWarnings.map((w) => w.code))].join(', ');
      setStatus('error', `Layout warning: ${topCodes} (${bits.join(' · ')})`);
    } else {
      setStatus(
        'success',
        incomplete
          ? `${bits.join(' · ')} — ${incomplete} had a word that would not fit`
          : bits.join(' · '),
      );
    }
  };

  const cancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    setStatus('idle', 'Generation cancelled');
  };

  const set = <K extends keyof WsLayoutOptions>(k: K, v: WsLayoutOptions[K]) =>
    setLayout((l) => ({ ...l, [k]: v }));

  return (
    <div className="panel">
      <div className="panel-body set-body gen-form">
        <textarea
          value={customWords}
          onChange={(e) => {
            setCustomWords(e.target.value);
            setUseCustom(true);
          }}
          placeholder="Your words — one per line"
          rows={4}
          disabled={busy}
          aria-label="Your word list"
        />
        <GenDrawer label={useCustom ? 'Themes' : `Theme · ${WORD_BANKS.find((b) => bankIds.includes(b.id))?.name ?? 'Themes'}`}>
          <div className="chips">
            {WORD_BANKS.map((b) => (
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
            aria-label="How many word searches"
          />
        </label>

        <GenMore>
          <button
            type="button"
            className="ink-quiet-btn ghost"
            onClick={() => browseGeneratorTemplates('wordsearch')}
            disabled={busy}
          >
            Templates
          </button>
          <label className="set-row">
            <span>Title</span>
            <input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} disabled={busy} />
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
            <span>Dirs</span>
            <div className="chips">
              {ALL_DIRS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  className={`chip ${activeDirs.includes(d.v) ? 'active' : ''}`}
                  onClick={() => toggleDir(d.v)}
                  disabled={busy}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {dirOverride && (
            <button type="button" className="ink-quiet-btn ghost" onClick={() => setDirOverride(null)} disabled={busy}>
              Follow level
            </button>
          )}
          <label className="toggle-row">
            <span>Secret leftover</span>
            <input type="checkbox" checked={useSecret} onChange={(e) => setUseSecret(e.target.checked)} disabled={busy} />
          </label>
          {useSecret && (
            <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Leftover letters spell…" disabled={busy} />
          )}
          <div className="set-row">
            <span>Answers</span>
            <div className="chips">
              {([['back_of_book', 'Back'], ['next_page', 'After'], ['none', 'None']] as [WsSolutionPlacement, string][]).map(([v, l]) => (
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
            <span>Size</span>
            <input
              type="range" min={0.3} max={0.85} step={0.01}
              value={style.fontScale}
              onChange={(e) => setStyle((s) => ({ ...s, fontScale: Number(e.target.value) }))}
              aria-label="Letter size"
            />
            <input type="color" value={style.letterColor} onChange={(e) => setStyle((s) => ({ ...s, letterColor: e.target.value }))} aria-label="Letter colour" />
          </label>
          <label className="set-row">
            <span>Space</span>
            <input
              type="range" min={-80} max={220} step={10}
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
          <p className="set-meta">Type four words, or pick a theme.</p>
        )}
      </div>
    </div>
  );
}
