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
import { GenerateBar } from '../shared/GenerateBar';
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
  const [useCustom, setUseCustom] = useState(false);
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
    () => wordSearchPreviewData(
      themes.flatMap((t) => t.words),
      level,
      dirOverride ?? undefined,
      style,
      layout,
      { width: genPage.width, height: genPage.height },
      bookTitle,
    ),
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
      <div className="panel-head">
        <span>Word search</span>
        <span className="badge">generator</span>
      </div>
      <div className="panel-body">
        <div className="section">
          <div className="section-title">Words</div>
          <div className="seg">
            <button className={!useCustom ? 'active' : ''} onClick={() => setUseCustom(false)} disabled={busy}>Theme</button>
            <button className={useCustom ? 'active' : ''} onClick={() => setUseCustom(true)} disabled={busy}>Own list</button>
          </div>
          {!useCustom ? (
            <div className="chips" style={{ marginTop: 8 }}>
              {WORD_BANKS.map((b) => (
                <button key={b.id} className={`chip ${bankIds.includes(b.id) ? 'active' : ''}`} onClick={() => toggleBank(b.id)} disabled={busy} title={`${b.words.length} words`}>
                  {bankIds.includes(b.id) ? '✓ ' : ''}{b.name}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={customWords}
              onChange={(e) => setCustomWords(e.target.value)}
              placeholder={'One word per line, or comma separated\nCAT, DOG, BIRD'}
              rows={5}
              style={{ width: '100%', marginTop: 8, resize: 'vertical' }}
              disabled={busy}
            />
          )}
          <div className="section-title" style={{ marginTop: 12 }}>Difficulty</div>
          <div className="chips">
            {DIFFS.map((d) => (
              <button
                key={d.v}
                className={`chip ${levels.includes(d.v) ? 'active' : ''}`}
                onClick={() => setLevels((cur) => toggleLevel(cur, d.v))}
                disabled={busy}
              >
                {levels.includes(d.v) ? '✓ ' : ''}{d.label}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 6 }}>Tap more than one — the book mixes them.</p>
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
            aria-label="How many word searches"
          />
        </div>

        <details className="section">
          <summary className="section-title">Advanced</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            <button
              className="btn primary"
              style={{ justifyContent: 'center' }}
              onClick={() => browseGeneratorTemplates('wordsearch')}
              disabled={busy}
            >
              Browse templates
            </button>
            <span className="label">Title</span>
            <input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} disabled={busy} style={{ width: '100%' }} />
            <span className="label">Font</span>
            <select
              value={style.fontFamily}
              onChange={(e) => setStyle((s) => ({ ...s, fontFamily: e.target.value }))}
            >
              {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>

            <div className="section-title">Word Rules &amp; Modes</div>
            <div className="chips">
              {ALL_DIRS.map((d) => (
                <button key={d.v} className={`chip ${activeDirs.includes(d.v) ? 'active' : ''}`} onClick={() => toggleDir(d.v)} disabled={busy}>{d.label}</button>
              ))}
            </div>
            {dirOverride && (
              <button className="btn sm" style={{ marginTop: 6 }} onClick={() => setDirOverride(null)} disabled={busy}>
                Follow difficulty directions
              </button>
            )}
            <label className="toggle-row" style={{ marginTop: 8 }}>
              <span>Secret leftover message</span>
              <input type="checkbox" checked={useSecret} onChange={(e) => setUseSecret(e.target.checked)} disabled={busy} />
            </label>
            {useSecret && (
              <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="READ THE LEFTOVER LETTERS" style={{ width: '100%', marginTop: 6 }} disabled={busy} />
            )}

            <div className="section-title">Solutions</div>
            <div className="opt-grid">
              {([['back_of_book', 'Back of book'], ['next_page', 'After each'], ['none', 'No solutions']] as [WsSolutionPlacement, string][]).map(([v, l]) => (
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
            <div className="row between">
              <span className="label" style={{ margin: 0 }}>Letters</span>
              <input type="color" value={style.letterColor} onChange={(e) => setStyle((s) => ({ ...s, letterColor: e.target.value }))} style={{ width: 50 }} />
            </div>
            <span className="label">Letter size — {Math.round(style.fontScale * 100)}%</span>
            <input
              type="range" min={0.3} max={0.85} step={0.01}
              value={style.fontScale}
              onChange={(e) => setStyle((s) => ({ ...s, fontScale: Number(e.target.value) }))}
              aria-label="Letter size"
            />
            <span className="label">Letter spacing — {style.letterSpacing}</span>
            <input
              type="range" min={-80} max={220} step={10}
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
          hint="The puzzle is locked after Generate."
        />
        {!canGenerate && !busy && (
          <p className="hint" style={{ marginTop: 6, color: 'var(--warn, #d08b3a)' }}>
            Pick a theme or type at least four real words first.
          </p>
        )}
      </div>
    </div>
  );
}
