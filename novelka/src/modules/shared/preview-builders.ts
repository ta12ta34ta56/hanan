import { BOX, type Difficulty, type GridSize, type SudokuPuzzle } from '../sudoku-maker/generator';
import { buildSudokuPages, type LayoutOptions } from '../sudoku-maker/build-pages';
import { type SudokuStyle } from '../sudoku-maker/renderer';
import { generateMazes, type Maze, type MazeOptions } from '../maze/generator';
import { buildMazePages, type MzLayoutOptions } from '../maze/build-pages';
import { type MazeStyle } from '../maze/renderer';
import { generateWordSearch, type DirectionId, type WSDifficulty, type WordSearchPuzzle } from '../word-search/generator';
import { buildWordSearchPages, type WsLayoutOptions } from '../word-search/build-pages';
import { type WordSearchStyle } from '../word-search/renderer';
import { generateCrossword, type CWDifficulty, type CrosswordPuzzle } from '../crossword/generator';
import { buildCrosswordPages, type CwLayoutOptions } from '../crossword/build-pages';
import { type CrosswordStyle } from '../crossword/renderer';

const SAMPLE_WORDS = ['CAT', 'DOG', 'BIRD', 'FISH', 'TREE', 'BOOK', 'STAR', 'MOON'];

const cache = new Map<string, unknown>();

function cached<T>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const value = make();
  cache.set(key, value);
  return value;
}

/** A finished valid grid (band-shift), then blank cells. No solver. Instant. */
function cannedSudoku(size: GridSize, level: Difficulty): SudokuPuzzle {
  const box = BOX[size];
  const solution: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      solution.push((box.w * (r % box.h) + Math.floor(r / box.h) + c) % size + 1);
    }
  }
  const keep =
    level === 'easy' ? 0.62
    : level === 'medium' ? 0.5
    : level === 'hard' ? 0.4
    : 0.32;
  const puzzle = solution.map((v, i) => {
    const r = Math.floor(i / size);
    const c = i % size;
    return ((r * 7 + c * 3 + r * c) % 10) / 10 < keep ? v : 0;
  });
  const clues = puzzle.filter((v) => v !== 0).length;
  return {
    hitTarget: true,
    targetRemoved: size * size - clues,
    id: `preview-s${size}`,
    size,
    box,
    difficulty: level,
    puzzle,
    solution,
    clues,
    removed: size * size - clues,
    index: 1,
  };
}

const PREVIEW_LAYOUT = { solutionPlacement: 'none' as const, showFolio: false };

export function sudokuPreviewData(
  size: GridSize,
  level: Difficulty,
  style: SudokuStyle,
  layout: LayoutOptions,
  page: { width: number; height: number },
): { objects?: unknown[] } {
  const puzzle = cached(`su:${size}:${level}`, () => cannedSudoku(size, level));
  const built = buildSudokuPages(
    [puzzle],
    style,
    { ...layout, ...PREVIEW_LAYOUT },
    page,
  );
  return (built.pages[0]?.data ?? { objects: [] }) as { objects?: unknown[] };
}

export function mazePreviewData(
  opts: MazeOptions,
  style: MazeStyle,
  layout: MzLayoutOptions,
  page: { width: number; height: number },
): { objects?: unknown[] } {
  const previewOpts: MazeOptions = {
    ...opts,
    width: Math.min(opts.width, 12),
    height: Math.min(opts.height, 12),
    seed: 42,
  };
  const mazes = cached(
    `mz:${previewOpts.shape}:${previewOpts.difficulty}:${previewOpts.startsAt}:${layout.mazesPerPage}`,
    () => generateMazes(previewOpts, Math.max(1, layout.mazesPerPage), 42),
  ) as Maze[];
  const built = buildMazePages(mazes, { ...layout, ...PREVIEW_LAYOUT }, style, page, 1);
  return (built.pages[0]?.data ?? { objects: [] }) as { objects?: unknown[] };
}

export function wordSearchPreviewData(
  words: string[],
  level: WSDifficulty,
  dirs: DirectionId[] | undefined,
  style: WordSearchStyle,
  layout: WsLayoutOptions,
  page: { width: number; height: number },
  title: string,
): { objects?: unknown[] } {
  const list = words.length >= 4 ? words.slice(0, 8) : SAMPLE_WORDS;
  const dirKey = (dirs ?? []).join(',');
  const puzzle = cached(
    `ws:${level}:${dirKey}:${list.join(',')}`,
    () => generateWordSearch(
      { size: 8, words: list, difficulty: level, directions: dirs, seed: 42, theme: title, maxAttempts: 8 },
      1,
    ),
  ) as WordSearchPuzzle;
  const built = buildWordSearchPages(
    [puzzle],
    style,
    { ...layout, title, ...PREVIEW_LAYOUT },
    page,
  );
  return (built.pages[0]?.data ?? { objects: [] }) as { objects?: unknown[] };
}

export function crosswordPreviewData(
  words: { word: string; clue: string }[],
  level: CWDifficulty,
  style: CrosswordStyle,
  layout: CwLayoutOptions,
  page: { width: number; height: number },
  title: string,
): { objects?: unknown[] } {
  const list = words.length >= 4
    ? words.slice(0, 8)
    : SAMPLE_WORDS.map((word) => ({ word, clue: `(${word.length} letters)` }));
  const puzzle = cached(
    `cw:${level}:${list.map((w) => w.word).join(',')}`,
    () => generateCrossword(
      { words: list, difficulty: level, seed: 42, theme: title, attempts: 4, maxWords: 8 },
      1,
    ),
  ) as CrosswordPuzzle;
  const built = buildCrosswordPages(
    [puzzle],
    { ...style, blockStyle: 'none' },
    { ...layout, title, ...PREVIEW_LAYOUT },
    page,
  );
  return (built.pages[0]?.data ?? { objects: [] }) as { objects?: unknown[] };
}
