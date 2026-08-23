import { useEffect, useMemo, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { browseGeneratorTemplates, useGeneratorStore } from '../../stores/generator-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { FONTS, loadFont } from '../../engine/font-manager';
import {
  DEFAULT_MAZE, generateMaze, generateMazes,
  type MazeDifficulty, type MazeOptions, type MazeShape,
} from './generator';
import { toggleLevel } from '../shared/puzzle-utils';
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
  generatePlacement,
  type PuzzleDestination,
} from '../shared/destination';
import { DestRow, GenerateBar, GenMore } from '../shared/GenerateBar';
import { usePuzzlePreview } from '../shared/usePuzzlePreview';
import { mazePreviewData } from '../shared/preview-builders';
import { clearPuzzlePreview } from '../shared/puzzle-preview';

const SHAPES: { v: MazeShape; label: string }[] = [
  { v: 'rectangular', label: 'Square' },
  { v: 'circular', label: 'Circle' },
  { v: 'hexagonal', label: 'Hexagon' },
  { v: 'triangular', label: 'Triangle' },
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
  const [levels, setLevels] = useState<MazeDifficulty[]>(['medium']);
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

  usePuzzlePreview(
    !busy,
    () => mazePreviewData(opts, style, layout, { width: genPage.width, height: genPage.height }),
    { width: genPage.width, height: genPage.height },
    [opts, style, layout.templateId, layout.mazesPerPage, genPage.width, genPage.height],
  );

  const estPages =
    Math.ceil(count / layout.mazesPerPage) +
    (layout.solutionPlacement === 'none'
      ? 0
      : layout.solutionPlacement === 'next_page'
        ? Math.ceil(count / layout.mazesPerPage)
        : Math.ceil(count / layout.solutionsPerPage));

  const generate = async () => {
    clearPuzzlePreview();
    setBusy(true);
    setStatus('busy', `Building ${count} maze${count === 1 ? '' : 's'}…`);
    try {
      await loadFont(style.fontFamily);
      const mix = levels.length ? levels : ['medium' as const];
      const mazes = mix.length === 1
        ? generateMazes({ ...opts, difficulty: mix[0] }, count)
        : Array.from({ length: count }, (_, i) =>
          generateMaze({
            ...opts,
            difficulty: mix[i % mix.length],
            seed: (opts.seed ?? Math.floor(Math.random() * 2 ** 31)) + i * 7919,
          }),
        );
      const place = generatePlacement(useCanvasStore.getState().pages, destination, estPages);
      const { pages: built } = buildMazePages(
        mazes, layout, style,
        { width: genPage.width, height: genPage.height },
        place.startPageNumber,
        place.pageCount,
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
      <div className="panel-body set-body gen-form">
        <div className="set-row">
          <span>Shape</span>
          <div className="chips">
            {SHAPES.map((s) => (
              <button
                key={s.v}
                type="button"
                className={`chip ${opts.shape === s.v ? 'active' : ''}`}
                onClick={() => set('shape', s.v)}
                disabled={busy}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="set-row">
          <span>Level</span>
          <div className="chips">
            {LEVELS.map((l) => (
              <button
                key={l.v}
                type="button"
                className={`chip ${levels.includes(l.v) ? 'active' : ''}`}
                onClick={() => {
                  const next = toggleLevel(levels, l.v);
                  setLevels(next);
                  set('difficulty', next[0] ?? 'medium');
                }}
                disabled={busy}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <label className="set-row">
          <span>Count</span>
          <input
            type="number"
            min={1}
            max={300}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
            disabled={busy}
            aria-label="How many mazes"
          />
        </label>

        <GenMore>
          <button
            type="button"
            className="ink-quiet-btn ghost"
            onClick={() => browseGeneratorTemplates('maze')}
            disabled={busy}
          >
            Templates
          </button>
          <label className="set-row">
            <span>Title</span>
            <input value={layout.title} onChange={(e) => setL('title', e.target.value)} disabled={busy} />
          </label>
          <label className="set-row">
            <span>Font</span>
            <select value={style.fontFamily} onChange={(e) => setStyle((s) => ({ ...s, fontFamily: e.target.value }))}>
              {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>
          </label>
          <div className="set-row">
            <span>Marks</span>
            <div className="chips">
              {MARKERS.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  className={`chip ${style.markers === m.v ? 'active' : ''}`}
                  onClick={() => setStyle((s) => ({ ...s, markers: m.v }))}
                  disabled={busy}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {opts.shape !== 'circular' && (
            <div className="set-row">
              <span>Door</span>
              <div className="chips">
                {(['top', 'bottom', 'left', 'right'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${opts.startsAt === s ? 'active' : ''}`}
                    onClick={() => set('startsAt', s)}
                    disabled={busy || levels.includes('expert')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="set-row">
            <span>Answers</span>
            <div className="chips">
              {([
                ['back_of_book', 'Back'],
                ['next_page', 'After'],
                ['none', 'None'],
              ] as [MzSolutionPlacement, string][]).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${layout.solutionPlacement === v ? 'active' : ''}`}
                  onClick={() => setL('solutionPlacement', v)}
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
                {solChoices.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${layout.solutionsPerPage === n ? 'active' : ''}`}
                    onClick={() => setL('solutionsPerPage', n)}
                    disabled={busy}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="set-row">
            <span>Walls</span>
            <input
              type="range" min={0.5} max={5} step={0.1}
              value={style.wallWidth}
              onChange={(e) => setStyle((s) => ({ ...s, wallWidth: Number(e.target.value) }))}
              aria-label="Wall width"
            />
            <input type="color" value={style.wallColor} onChange={(e) => setStyle((s) => ({ ...s, wallColor: e.target.value }))} aria-label="Wall colour" />
          </label>
          <DestRow
            destination={destination}
            onDestination={setDestination}
            replace={replace}
            onReplace={setReplace}
            busy={busy}
          />
        </GenMore>

        <GenerateBar
          onGenerate={() => void generate()}
          busy={busy}
          estPages={estPages}
        />
      </div>
    </div>
  );
}
