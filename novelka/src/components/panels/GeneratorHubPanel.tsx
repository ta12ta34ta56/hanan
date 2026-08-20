import { lazy, Suspense, type ReactElement } from 'react';
import { Icon, type IconName } from '../Icon';
import { useGeneratorStore, type GeneratorId } from '../../stores/generator-store';
import { ClosePanelButton } from '../ClosePanelButton';

/**
 * Generator panels are heavy (puzzle engines, renderers, workers). Each is its
 * own chunk, downloaded only when the user actually opens that generator —
 * the hub card grid stays in the main bundle.
 *
 * Handwriting is templates only (owner notebook Q-07). Not in this hub.
 */
const SudokuPanel = lazy(() =>
  import('../../modules/sudoku-maker/SudokuPanel').then((m) => ({ default: m.SudokuPanel })),
);
const WordSearchPanel = lazy(() =>
  import('../../modules/word-search/WordSearchPanel').then((m) => ({ default: m.WordSearchPanel })),
);
const CrosswordPanel = lazy(() =>
  import('../../modules/crossword/CrosswordPanel').then((m) => ({ default: m.CrosswordPanel })),
);
const MazePanel = lazy(() =>
  import('../../modules/maze/MazePanel').then((m) => ({ default: m.MazePanel })),
);

const GENERATORS: {
  id: Exclude<GeneratorId, 'handwriting'>;
  label: string;
  icon: IconName;
}[] = [
  { id: 'sudoku', label: 'Sudoku', icon: 'puzzle' },
  { id: 'maze', label: 'Maze', icon: 'grid' },
  { id: 'wordsearch', label: 'Word search', icon: 'search' },
  { id: 'crossword', label: 'Crossword', icon: 'crossword' },
];

const GENERATOR_PANEL: Record<Exclude<GeneratorId, 'handwriting'>, () => ReactElement> = {
  sudoku: () => <SudokuPanel />,
  wordsearch: () => <WordSearchPanel />,
  crossword: () => <CrosswordPanel />,
  maze: () => <MazePanel />,
};

export function GeneratorHubPanel() {
  const activeGenerator = useGeneratorStore((s) => s.activeGenerator);
  const openGenerator = useGeneratorStore((s) => s.openGenerator);

  if (activeGenerator && activeGenerator !== 'handwriting') {
    const Panel = GENERATOR_PANEL[activeGenerator];
    const meta = GENERATORS.find((g) => g.id === activeGenerator);

    return (
      <div className="panel">
        <div className="panel-head">
          <button
            type="button"
            className="gen-back"
            onClick={() => openGenerator(null)}
            title="Back"
            aria-label="Back to generators"
          >
            <Icon name="chevronLeft" size={13} />
          </button>
          <span>{meta?.label ?? 'Generator'}</span>
          <ClosePanelButton />
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <Suspense fallback={<div className="empty">Loading…</div>}>
            <Panel />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Generators</span>
        <ClosePanelButton />
      </div>
      <div className="panel-body">
        <div className="gen-picks">
          {GENERATORS.map((g) => (
            <button
              key={g.id}
              type="button"
              className="gen-pick"
              onClick={() => openGenerator(g.id)}
            >
              <Icon name={g.icon} size={18} />
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
