/**
 * Template gallery grouping + pair apply — node src/services/template-groups.test.mjs
 *
 * One card per variant family. Pair badge + verso/recto pick. No invented art.
 */
import { familyBadge, groupTemplateCards, pairSideForInteriorIndex, pickPairTemplate } from './template-groups.built.mjs';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

const lined = [
  { id: 'lined', name: 'Lined pages (Standard)', variantGroup: 'lined', variantLabel: 'Standard' },
  { id: 'lined-thin', name: 'Lined pages (Thin)', variantGroup: 'lined', variantLabel: 'Thin' },
  { id: 'lined-wide', name: 'Lined pages (Wide)', variantGroup: 'lined', variantLabel: 'Wide' },
  { id: 'lined-bold', name: 'Lined pages (Bold)', variantGroup: 'lined', variantLabel: 'Bold' },
];
const singles = [
  { id: 'dotted', name: 'Dot grid' },
  { id: 'graph', name: 'Graph paper' },
];
const pair = [
  { id: 'spread-l', name: 'Weekly left', pairGroup: 'weekly', pairSide: 'left' },
  { id: 'spread-r', name: 'Weekly right', pairGroup: 'weekly', pairSide: 'right' },
];

console.log('\n=== variants collapse to one card ===');
{
  const cards = groupTemplateCards(lined);
  check('one card for lined family', cards.length === 1, `count=${cards.length}`);
  check('four siblings', cards[0].variants.length === 4);
  check('primary is first sibling', cards[0].primary.id === 'lined');
  check('name drops (Standard)', cards[0].name === 'Lined pages', `name=${cards[0].name}`);
  check('not a pair', cards[0].isPair === false);
}

console.log('\n=== singles stay singles ===');
{
  const cards = groupTemplateCards(singles);
  check('two cards', cards.length === 2);
  check('ids preserved', cards.map((c) => c.primary.id).join(',') === 'dotted,graph');
}

console.log('\n=== pair badge + apply rule ===');
{
  const cards = groupTemplateCards(pair);
  check('one pair card', cards.length === 1 && cards[0].isPair === true);
  check('both pages in the folder', cards[0].variants.length === 2);
  check('pair badge', familyBadge(cards[0]) === 'PAIR');
  check('right mate attached', cards[0].pairMate?.id === 'spread-r');
  check('interior 0 is left/verso', pairSideForInteriorIndex(0) === 'left');
  check('interior 1 is right/recto', pairSideForInteriorIndex(1) === 'right');
  const left = pair[0];
  const right = pair[1];
  check('verso gets left', pickPairTemplate(left, right, 0).id === 'spread-l');
  check('recto gets right', pickPairTemplate(left, right, 1).id === 'spread-r');
  check('missing mate falls back', pickPairTemplate(left, undefined, 1).id === 'spread-l');
}

console.log('\n=== mixed list ===');
{
  const cards = groupTemplateCards([...lined, ...singles, ...pair]);
  check('lined + two singles + one pair', cards.length === 4, `count=${cards.length}`);
  check('no duplicate lined cards', cards.filter((c) => c.key.startsWith('var:')).length === 1);
}

console.log(`\nTEMPLATE GROUPS  (${pass} passed${fail ? `, ${fail} FAILED` : ''})`);
if (fail) process.exit(1);
