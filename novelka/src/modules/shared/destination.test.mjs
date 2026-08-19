/**
 * Destination + lock — npm run test:destination
 *
 * Owner rules: All / Blank / Append, Replace, auto-add pages, never touch
 * the cover, lock puzzle content after generate.
 */
import { applyGeneratedPages, generatePlacement, isBlankInterior, lockPuzzlePage, densityFromTemplate, filterSolutionCounts } from './destination.built.mjs';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

const cover = {
  id: 'cover',
  name: 'Cover',
  role: 'cover',
  width: 900,
  height: 666,
  background: '#2a2f38',
  data: { objects: [{ type: 'textbox', text: 'TITLE' }] },
};
const blank = (id) => ({
  id,
  name: id,
  role: 'interior',
  width: 432,
  height: 648,
  background: '#ffffff',
  data: null,
});
const filled = (id, text = 'old') => ({
  id,
  name: id,
  role: 'interior',
  width: 432,
  height: 648,
  background: '#ffffff',
  data: { objects: [{ type: 'textbox', text }] },
});
const built = (id, role = 'sudoku-clue') => ({
  id,
  name: `Sudoku ${id}`,
  role: 'interior',
  kind: 'sudoku',
  width: 432,
  height: 648,
  background: '#ffffff',
  data: {
    objects: [
      { type: 'textbox', text: 'Puzzle 1', sudokuRole: 'sudoku-label' },
      { type: 'textbox', text: '5', sudokuRole: role, moduleId: 'sudoku' },
    ],
  },
});

console.log('\n=== append ===');
{
  const r = applyGeneratedPages({
    built: [built('g1'), built('g2')],
    current: [cover, blank('i1'), filled('i2')],
    destination: 'append',
    replace: true,
  });
  check('cover stays first', r.pages[0].id === 'cover');
  check('existing interiors stay', r.pages[1].id === 'i1' && r.pages[2].id === 'i2');
  check('generated appended', r.pages.length === 5);
  check('added = generated count', r.added === 2);
}

console.log('\n=== all + replace, auto-add ===');
{
  const r = applyGeneratedPages({
    built: [built('g1'), built('g2'), built('g3')],
    current: [cover, blank('i1')],
    destination: 'all',
    replace: true,
  });
  check('cover untouched', r.pages[0].id === 'cover' && r.pages[0].data.objects[0].text === 'TITLE');
  check('auto-added two interiors', r.added === 2, `added=${r.added}`);
  check('three interiors after cover', r.pages.filter((p) => p.role !== 'cover').length === 3);
  check('first dest kept its id', r.pages[1].id === 'i1');
  check('first dest now has puzzle', r.pages[1].kind === 'sudoku');
}

console.log('\n=== blank only skips filled ===');
{
  const r = applyGeneratedPages({
    built: [built('g1')],
    current: [cover, filled('i1', 'keep me'), blank('i2')],
    destination: 'blank',
    replace: true,
  });
  check('filled page kept', r.pages[1].data.objects[0].text === 'keep me');
  check('blank page received puzzle', r.pages[2].kind === 'sudoku');
  check('no extra pages', r.added === 0);
}

console.log('\n=== replace off stacks ===');
{
  const r = applyGeneratedPages({
    built: [built('g1')],
    current: [cover, filled('i1', 'old')],
    destination: 'all',
    replace: false,
  });
  const objs = r.pages[1].data.objects;
  check('old object still there', objs.some((o) => o.text === 'old'));
  check('new puzzle stacked', objs.some((o) => o.sudokuRole === 'sudoku-clue'));
}

console.log('\n=== lock after generate ===');
{
  const locked = lockPuzzlePage(built('g1'));
  const objs = locked.data.objects;
  const label = objs.find((o) => o.sudokuRole === 'sudoku-label');
  const clue = objs.find((o) => o.sudokuRole === 'sudoku-clue');
  check('label stays editable', label.locked !== true && label.selectable !== false);
  check('clue is locked', clue.locked === true && clue.selectable === false);
}

console.log('\n=== chrome text stays free ===');
{
  const page = {
    id: 'p',
    name: 'Sudoku',
    role: 'interior',
    kind: 'sudoku',
    width: 432,
    height: 648,
    background: '#ffffff',
    data: {
      objects: [
        { type: 'textbox', text: 'Enjoy the challenge.', moduleId: 'sudoku' },
        { type: 'textbox', text: 'Quote', mzRole: 'mz-chrome', moduleId: 'maze', mzPuzzle: 'm1' },
        { type: 'textbox', text: 'Fill every row.', role: 'instruction' },
        { type: 'line', sudokuRole: 'sudoku-rule', moduleId: 'sudoku' },
        { type: 'path', mzRole: 'mz-wall', moduleId: 'maze' },
      ],
    },
  };
  const locked = lockPuzzlePage(page);
  const objs = locked.data.objects;
  const quote = objs.find((o) => o.text === 'Enjoy the challenge.');
  const mazeChrome = objs.find((o) => o.mzRole === 'mz-chrome');
  const instruction = objs.find((o) => o.role === 'instruction');
  const rule = objs.find((o) => o.sudokuRole === 'sudoku-rule');
  const wall = objs.find((o) => o.mzRole === 'mz-wall');
  check('untagged quote stays editable', quote.locked !== true && quote.selectable !== false);
  check('maze chrome stays editable', mazeChrome.locked !== true && mazeChrome.selectable !== false);
  check('instruction stays editable', instruction.locked !== true && instruction.selectable !== false);
  check('grid rule is locked', rule.locked === true && rule.selectable === false);
  check('maze wall is locked', wall.locked === true && wall.selectable === false);
}

console.log('\n=== fat book pulls old lines out of the new gutter ===');
{
  const thinLeft = 27; // 0.375" — legal at 24 pages, illegal at 151
  const linePage = {
    id: 'old',
    name: 'old',
    role: 'interior',
    width: 432,
    height: 648,
    background: '#ffffff',
    data: {
      objects: [{ type: 'line', left: thinLeft, top: 40, width: 378, height: 0, scaleX: 1, scaleY: 1, strokeWidth: 1 }],
    },
  };
  const extras = Array.from({ length: 149 }, (_, i) => blank(`b${i}`));
  const r = applyGeneratedPages({
    built: [built('g1')],
    current: [cover, linePage, ...extras],
    destination: 'append',
    replace: true,
  });
  const interiors = r.pages.filter((p) => p.role !== 'cover');
  check('book is now 151 interiors', interiors.length === 151, `n=${interiors.length}`);
  const line = interiors[0].data.objects[0];
  check('old line left the 0.375" gutter', Number(line.left) >= 35, `left=${line.left}`);
}

console.log('\n=== generate placement uses the real book ===');
{
  const current = [cover, ...Array.from({ length: 150 }, (_, i) => blank(`p${i}`))];
  const append = generatePlacement(current, 'append', 10);
  check('append starts after 150', append.startPageNumber === 151, `start=${append.startPageNumber}`);
  check('append book is 160', append.pageCount === 160, `n=${append.pageCount}`);
  const all = generatePlacement(current, 'all', 20);
  check('all starts at page 1', all.startPageNumber === 1);
  check('all keeps the 150-page book', all.pageCount === 150, `n=${all.pageCount}`);
  const fat = generatePlacement(current, 'all', 200);
  check('all grows when the batch is bigger', fat.pageCount === 200);
}

console.log('\n=== helpers ===');
check('blank interior', isBlankInterior(blank('x')));
check('filled is not blank', !isBlankInterior(filled('x')));
check('cover is not blank', !isBlankInterior(cover));
check('density from template', densityFromTemplate([2, 4]) === 2);
check('density fallback', densityFromTemplate(undefined) === 1);
check(
  'filter solutions maze 1/4/6',
  JSON.stringify(filterSolutionCounts([1, 4, 6, 9], [1, 4, 6])) === '[1,4,6]',
);
check(
  'filter solutions crossword no 6',
  JSON.stringify(filterSolutionCounts([1, 2, 4, 6], [1, 2, 4])) === '[1,2,4]',
);

console.log(`\nDESTINATION CHECKS  (${pass} passed${fail ? `, ${fail} FAILED` : ''})`);
if (fail) process.exit(1);
