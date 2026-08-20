import { useState } from 'react';
import { IN } from '../../types/canvas.types';
import { TRIM_PRESETS } from '../../services/book';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { generateSet, type Difficulty, type GridSize } from '../../modules/sudoku-maker/generator';
import { buildSudokuPages, DEFAULT_LAYOUT } from '../../modules/sudoku-maker/build-pages';
import { DEFAULT_STYLE } from '../../modules/sudoku-maker/renderer';
import { DEFAULT_MAZE, generateMazes, type MazeDifficulty, type MazeShape } from '../../modules/maze/generator';
import { buildMazePages, DEFAULT_MZ_LAYOUT } from '../../modules/maze/build-pages';
import { DEFAULT_MAZE_STYLE } from '../../modules/maze/renderer';

type Kind = 'sudoku' | 'maze';

const SHAPES: { v: MazeShape; label: string }[] = [
  { v: 'rectangular', label: 'Square' },
  { v: 'circular', label: 'Circle' },
  { v: 'hexagonal', label: 'Hexagon' },
  { v: 'triangular', label: 'Triangle' },
];

const LEVELS: { v: Difficulty; label: string }[] = [
  { v: 'easy', label: 'Easy' },
  { v: 'medium', label: 'Medium' },
  { v: 'hard', label: 'Hard' },
  { v: 'expert', label: 'Expert' },
];

/**
 * Home "Quick puzzle making" — basic inputs only. Lands in the editor.
 */
export function QuickPuzzleModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const newBook = useCanvasStore((s) => s.newBook);
  const replaceAllPages = useCanvasStore((s) => s.replaceAllPages);
  const setStatus = useToastStore((s) => s.setStatus);

  const [kind, setKind] = useState<Kind>('sudoku');
  const [trimId, setTrimId] = useState('kdp6x9');
  const [size, setSize] = useState<GridSize>(9);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [shape, setShape] = useState<MazeShape>('rectangular');
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const maxCount = kind === 'sudoku' && size === 16 ? 8 : 50;

  const generate = async () => {
    const n = Math.max(1, Math.min(maxCount, count));
    const preset = TRIM_PRESETS.find((t) => t.id === trimId) ?? TRIM_PRESETS[0];
    const settings = {
      trimWidth: preset.wIn * IN,
      trimHeight: preset.hIn * IN,
      paper: 'white' as const,
      binding: 'paperback' as const,
    };
    const pageSize = { width: settings.trimWidth, height: settings.trimHeight };

    setBusy(true);
    setProgress('Starting…');
    try {
      await newBook({
        name: kind === 'sudoku' ? 'Sudoku Book' : 'Maze Book',
        settings,
        pageCount: 1,
        includeCover: false,
      });

      if (kind === 'sudoku') {
        setProgress(`Generating ${n} sudoku puzzles…`);
        const puzzles = generateSet(
          { size, difficulty, count: n },
          (done, total) => setProgress(`Puzzle ${done} of ${total}`),
        );
        const built = buildSudokuPages(puzzles, DEFAULT_STYLE, {
          ...DEFAULT_LAYOUT,
          puzzlesPerPage: 1,
          solutionsPerPage: 4,
          solutionPlacement: 'back_of_book',
          title: 'Sudoku',
        }, pageSize);
        await replaceAllPages(built.pages);
      } else {
        setProgress(`Building ${n} mazes…`);
        const mazes = generateMazes(
          { ...DEFAULT_MAZE, shape, difficulty: difficulty as MazeDifficulty },
          n,
        );
        const built = buildMazePages(mazes, {
          ...DEFAULT_MZ_LAYOUT,
          mazesPerPage: 1,
          solutionsPerPage: 4,
          solutionPlacement: 'back_of_book',
          title: 'Mazes',
        }, DEFAULT_MAZE_STYLE, pageSize);
        await replaceAllPages(built.pages);
      }

      setStatus('success', `${n} ${kind === 'sudoku' ? 'sudoku' : 'maze'} puzzles ready`);
      onCreated();
    } catch (e) {
      setStatus('error', e instanceof Error ? e.message : 'Could not generate');
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal ink-modal">
        <div className="modal-head">
          <span>Quick puzzle</span>
          <button className="btn icon ghost" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <div className="set-row">
            <span>Kind</span>
            <div className="chips">
              <button type="button" className={`chip ${kind === 'sudoku' ? 'active' : ''}`} onClick={() => setKind('sudoku')} disabled={busy}>Sudoku</button>
              <button type="button" className={`chip ${kind === 'maze' ? 'active' : ''}`} onClick={() => setKind('maze')} disabled={busy}>Maze</button>
            </div>
          </div>

          <label className="set-row">
            <span>Trim</span>
            <select value={trimId} onChange={(e) => setTrimId(e.target.value)} aria-label="Trim size" disabled={busy}>
              {TRIM_PRESETS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>

          {kind === 'sudoku' ? (
            <div className="set-row">
              <span>Grid</span>
              <div className="chips">
                {([4, 9, 16] as GridSize[]).map((s) => (
                  <button key={s} type="button" className={`chip ${size === s ? 'active' : ''}`} onClick={() => setSize(s)} disabled={busy}>
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="set-row">
              <span>Shape</span>
              <div className="chips">
                {SHAPES.map((s) => (
                  <button key={s.v} type="button" className={`chip ${shape === s.v ? 'active' : ''}`} onClick={() => setShape(s.v)} disabled={busy}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="set-row">
            <span>Level</span>
            <div className="chips">
              {LEVELS.map((l) => (
                <button key={l.v} type="button" className={`chip ${difficulty === l.v ? 'active' : ''}`} onClick={() => setDifficulty(l.v)} disabled={busy}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <label className="set-row">
            <span>How many</span>
            <input
              type="number"
              min={1}
              max={maxCount}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)))}
              aria-label="How many puzzles"
              disabled={busy}
            />
          </label>
          {kind === 'sudoku' && size === 16 && (
            <p className="set-meta">16×16 is capped at 8 here.</p>
          )}
          {progress && <p className="set-meta">{progress}</p>}
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={() => void generate()} disabled={busy}>
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
