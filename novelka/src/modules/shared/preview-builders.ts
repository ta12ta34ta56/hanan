import { generatePuzzle, type Difficulty, type GridSize, type SudokuPuzzle } from '../sudoku-maker/generator';
import { buildSudokuPages, type LayoutOptions } from '../sudoku-maker/build-pages';
import { type SudokuStyle } from '../sudoku-maker/renderer';
import { generateMazes, type MazeOptions } from '../maze/generator';
import { buildMazePages, type MzLayoutOptions } from '../maze/build-pages';
import { type MazeStyle } from '../maze/renderer';
import { generateWordSearch, type DirectionId, type WSDifficulty } from '../word-search/generator';
import { buildWordSearchPages, type WsLayoutOptions } from '../word-search/build-pages';
import { type WordSearchStyle } from '../word-search/renderer';
import { generateCrossword, type CWDifficulty } from '../crossword/generator';
import { buildCrosswordPages, type CwLayoutOptions } from '../crossword/build-pages';
import { type CrosswordStyle } from '../crossword/renderer';

const SAMPLE_WORDS = ['CAT', 'DOG', 'BIRD', 'FISH', 'TREE', 'BOOK', 'STAR', 'MOON'];

export function sudokuPreviewData(
  size: GridSize,
  level: Difficulty,
  style: SudokuStyle,
  layout: LayoutOptions,
  page: { width: number; height: number },
): { objects?: unknown[] } {
  const previewLevel: Difficulty = size === 16 ? 'easy' : level;
  const puzzle: SudokuPuzzle = generatePuzzle(
    { size, difficulty: previewLevel, symmetric: true, seed: 42, budgetMs: 700 },
    1,
  );
  const built = buildSudokuPages(
    [puzzle],
    style,
    { ...layout, solutionPlacement: 'none' },
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
  const mazes = generateMazes({ ...opts, seed: 42 }, Math.max(1, layout.mazesPerPage), 42);
  const built = buildMazePages(mazes, { ...layout, solutionPlacement: 'none' }, style, page, 1);
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
  const list = words.length >= 4 ? words.slice(0, 12) : SAMPLE_WORDS;
  const puzzle = generateWordSearch(
    { size: 11, words: list, difficulty: level, directions: dirs, seed: 42, theme: title },
    1,
  );
  const built = buildWordSearchPages(
    [puzzle],
    style,
    { ...layout, title, solutionPlacement: 'none' },
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
    ? words.slice(0, 10)
    : SAMPLE_WORDS.map((word) => ({ word, clue: `(${word.length} letters)` }));
  const puzzle = generateCrossword({ words: list, difficulty: level, seed: 42, theme: title }, 1);
  const built = buildCrosswordPages(
    [puzzle],
    { ...style, blockStyle: 'none' },
    { ...layout, title, solutionPlacement: 'none' },
    page,
  );
  return (built.pages[0]?.data ?? { objects: [] }) as { objects?: unknown[] };
}
