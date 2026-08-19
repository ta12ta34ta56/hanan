/**
 * Gutter categories + interior names — node src/services/gutter-band.test.mjs
 */
import { gutterBandChanged, fitPagesToCategory } from './gutter-band.built.mjs';
import { renumberInteriorPages, interiorPageCount, interiorPageNumber } from './template-groups.built.mjs';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

console.log('\n=== same category, no rebuild ===');
check('24 and 150 are the same band', gutterBandChanged(24, 150) === false);
check('40 and 140 are the same band', gutterBandChanged(40, 140) === false);
check('151 and 300 are the same band', gutterBandChanged(151, 300) === false);
check('301 and 500 are the same band', gutterBandChanged(301, 500) === false);

console.log('\n=== crossing a category ===');
check('150 → 151 is a new band', gutterBandChanged(150, 151) === true);
check('151 → 150 is a new band', gutterBandChanged(151, 150) === true);
check('300 → 301 is a new band', gutterBandChanged(300, 301) === true);
check('500 → 501 is a new band', gutterBandChanged(500, 501) === true);
check('700 → 701 is a new band', gutterBandChanged(700, 701) === true);

console.log('\n=== names skip the cover ===');
{
  const named = renumberInteriorPages([
    { role: 'cover', name: 'Page 1' },
    { role: 'interior', name: 'Page 3' },
    { role: 'interior', name: 'Page' },
    { role: 'interior', name: 'Sudoku 1' },
  ]);
  check('cover is named Cover', named[0].name === 'Cover', `name=${named[0].name}`);
  check('first interior is Page 1', named[1].name === 'Page 1', `name=${named[1].name}`);
  check('second interior is Page 2', named[2].name === 'Page 2', `name=${named[2].name}`);
  check('puzzle name is left alone', named[3].name === 'Sudoku 1');
}

console.log('\n=== interior numbers never count the cover ===');
{
  const book = [{ role: 'cover' }, { role: 'interior' }, { role: 'interior' }];
  check('first interior is 1', interiorPageNumber(book, 1) === 1);
  check('second interior is 2', interiorPageNumber(book, 2) === 2);
  check('count is 2', interiorPageCount(book) === 2);
}

console.log('\n=== fat book slides leftover lines ===');
{
  const thinLeft = 27;
  const linePage = {
    role: 'interior',
    name: 'Page 1',
    width: 432,
    height: 648,
    data: {
      objects: [{ type: 'line', left: thinLeft, top: 40, width: 378, height: 0, scaleX: 1, scaleY: 1, strokeWidth: 1 }],
    },
  };
  const extras = Array.from({ length: 150 }, (_, i) => ({
    role: 'interior',
    name: `Page ${i + 2}`,
    width: 432,
    height: 648,
    data: null,
  }));
  const pages = fitPagesToCategory([
    { role: 'cover', name: 'Cover', width: 900, height: 666, data: { objects: [] } },
    linePage,
    ...extras,
  ]);
  const interiors = pages.filter((p) => p.role !== 'cover');
  check('151 interiors', interiors.length === 151, `n=${interiors.length}`);
  check('first interior named Page 1', interiors[0].name === 'Page 1');
  check('old line left the thin gutter', Number(interiors[0].data.objects[0].left) >= 35, `left=${interiors[0].data.objects[0].left}`);
}

console.log(`\nGUTTER BAND  (${pass} passed${fail ? `, ${fail} FAILED` : ''})`);
if (fail) process.exit(1);
