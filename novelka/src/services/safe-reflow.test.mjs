/**
 * Growing the book widens the gutter. Existing lines must pull in.
 * node after: esbuild src/services/safe-reflow.ts --bundle --format=esm --outfile=src/services/safe-reflow.built.mjs
 */
import { refitInteriorPages, refitSerializedObject } from './safe-reflow.built.mjs';
import { kdpMarginsFor, safeAreaFor, serializedObjectBounds } from './kdp.built.mjs';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

const W = 432;
const H = 648;

function lineAt(left, width) {
  return {
    type: 'line',
    left,
    top: 40,
    width,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 'left',
    originY: 'top',
    strokeWidth: 1,
  };
}

function inside(obj, pageNumber, pageCount) {
  const m = kdpMarginsFor(Math.max(pageCount, 24));
  const safe = safeAreaFor(W, H, pageNumber, m);
  const b = serializedObjectBounds(obj);
  return (
    b.left >= safe.left - 0.6 &&
    b.top >= safe.top - 0.6 &&
    b.left + b.width <= safe.left + safe.width + 0.6 &&
    b.top + b.height <= safe.top + safe.height + 0.6
  );
}

console.log('\n=== 24-page line sits in the 0.375" box ===');
{
  const m = kdpMarginsFor(24);
  const safe = safeAreaFor(W, H, 1, m);
  const obj = lineAt(safe.left, safe.width);
  check('fits at 24 pages', inside(obj, 1, 24), `gutter=${m.gutterInches}`);
  check('does not fit at 151 pages', !inside(obj, 1, 151));
}

console.log('\n=== refit pulls the same line into the 151-page box ===');
{
  const thin = kdpMarginsFor(24);
  const thinSafe = safeAreaFor(W, H, 1, thin);
  const obj = lineAt(thinSafe.left, thinSafe.width);
  const next = refitSerializedObject(obj, { width: W, height: H }, 1, 151);
  check('now inside 151-page safe', inside(next, 1, 151));
  const fat = kdpMarginsFor(151);
  const fatSafe = safeAreaFor(W, H, 1, fat);
  const b = serializedObjectBounds(next);
  check('left is on the thicker gutter', Math.abs(b.left - fatSafe.left) < 1, `left=${b.left} gutter=${fatSafe.left}`);
  check('not wider than the new box', b.width <= fatSafe.width + 0.6, `w=${b.width} max=${fatSafe.width}`);
}

console.log('\n=== adding pages past 150 refits every interior, not the cover ===');
{
  const thin = kdpMarginsFor(24);
  const thinSafe = safeAreaFor(W, H, 1, thin);
  const cover = {
    role: 'cover',
    width: 900,
    height: 666,
    data: { objects: [{ type: 'textbox', text: 'TITLE', left: 0, top: 0, width: 200, height: 40 }] },
  };
  const interiors = Array.from({ length: 151 }, (_, i) => ({
    role: 'interior',
    width: W,
    height: H,
    data: {
      objects: [lineAt(thinSafe.left, thinSafe.width), { type: 'textbox', text: String(i + 1), left: thinSafe.left, top: 20, width: 40, height: 14 }],
    },
  }));
  const out = refitInteriorPages([cover, ...interiors]);
  check('cover text unmoved', out[0].data.objects[0].left === 0);
  check('151 interiors kept', out.filter((p) => p.role !== 'cover').length === 151);
  const first = out[1].data.objects[0];
  const last = out[151].data.objects[0];
  check('first interior (recto) inside', inside(first, 1, 151));
  check('last interior (recto) inside', inside(last, 151, 151));
}

console.log('\n=== cover does not push a 150-page book into the 0.5" band ===');
{
  const thin = kdpMarginsFor(150);
  const fat = kdpMarginsFor(151);
  check('150 interiors stay on 0.375', thin.gutterInches === 0.375, `g=${thin.gutterInches}`);
  check('151 interiors jump to 0.5', fat.gutterInches === 0.5, `g=${fat.gutterInches}`);
}

console.log('\n=== same gutter band does not need to shrink ===');
{
  const m = kdpMarginsFor(24);
  const safe = safeAreaFor(W, H, 1, m);
  const obj = lineAt(safe.left, safe.width);
  const next = refitSerializedObject({ ...obj }, { width: W, height: H }, 1, 80);
  check('still inside at 80 pages', inside(next, 1, 80));
  const fat = kdpMarginsFor(151);
  check('did not jump to the 0.5" band', Number(next.left) < fat.gutter - 1, `left=${next.left}`);
}

console.log('\n=== a tall text box is not crushed ===');
{
  const thin = kdpMarginsFor(24);
  const thinSafe = safeAreaFor(W, H, 1, thin);
  const box = {
    type: 'textbox',
    text: 'Notes',
    left: thinSafe.left,
    top: 40,
    width: 80,
    height: 4000,
    scaleX: 1,
    scaleY: 1,
    originX: 'left',
    originY: 'top',
  };
  const next = refitSerializedObject(box, { width: W, height: H }, 1, 151);
  check('scaleY stays 1', Number(next.scaleY) === 1, `sy=${next.scaleY}`);
  check('height stays huge (not scaled)', Number(next.height) === 4000, `h=${next.height}`);
}

console.log('\n=== a puzzle cell only slides ===');
{
  const thin = kdpMarginsFor(24);
  const thinSafe = safeAreaFor(W, H, 1, thin);
  const cell = {
    type: 'textbox',
    text: '5',
    sudokuRole: 'sudoku-clue',
    moduleId: 'sudoku',
    left: thinSafe.left,
    top: 80,
    width: 24,
    height: 24,
    scaleX: 1,
    scaleY: 1,
  };
  const next = refitSerializedObject(cell, { width: W, height: H }, 1, 151);
  const fat = kdpMarginsFor(151);
  const fatSafe = safeAreaFor(W, H, 1, fat);
  check('cell slid to the new gutter', Math.abs(Number(next.left) - fatSafe.left) < 1, `left=${next.left}`);
  check('cell not scaled', Number(next.scaleX) === 1 && Number(next.scaleY) === 1);
}

console.log('\n=== full-page tint is left alone ===');
{
  const bg = { type: 'rect', left: 0, top: 0, width: W, height: H, scaleX: 1, scaleY: 1 };
  const next = refitSerializedObject(bg, { width: W, height: H }, 1, 200);
  check('background still edge to edge', next.left === 0 && next.width === W);
}

console.log(`\nSAFE REFLOW  (${pass} passed${fail ? `, ${fail} FAILED` : ''})`);
if (fail) process.exit(1);
