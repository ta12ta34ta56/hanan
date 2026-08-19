/**
 * Puzzle-frame leak audit. Every Sudoku / Word Search / Crossword / Maze
 * frame must sit inside the KDP safe box at every locked trim. Nothing
 * paints a cream/white sheet over the paper.
 */
import { JSDOM } from 'jsdom';
import { installCanvasStub } from '../../../test/helpers/jsdom-canvas-stub.mjs';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
installCanvasStub(dom);
dom.window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
globalThis.Image = dom.window.Image;
if (!dom.window.document.fonts) {
  dom.window.document.fonts = {
    load: async () => [], ready: Promise.resolve(), add() {}, has() { return false; },
    size: 0, [Symbol.iterator]: function* () {},
  };
}

const { SUDOKU_TEMPLATES } = await import('../sudoku-maker/templates.built.mjs');
const { WS_TEMPLATES } = await import('../word-search/templates.built.mjs');
const { CW_TEMPLATES } = await import('../crossword/templates.built.mjs');
const { MZ_TEMPLATES } = await import('../maze/templates.built.mjs');
const { kdpMarginsFor, safeAreaFor, serializedObjectBounds, inchesToPt } = await import('../../services/kdp.built.mjs');

const LOCKED = [
  { id: '6x9', w: 6, h: 9 },
  { id: '8.5x11', w: 8.5, h: 11 },
  { id: '8x10', w: 8, h: 10 },
  { id: '7x10', w: 7, h: 10 },
  { id: '5.5x8.5', w: 5.5, h: 8.5 },
  { id: 'A4', w: 8.27, h: 11.69 },
];

const VARIATIONS = [];
for (const t of LOCKED) {
  const w = inchesToPt(t.w);
  const h = inchesToPt(t.h);
  VARIATIONS.push({ label: `${t.id} p1/24`, w, h, pageNumber: 1, pageCount: 24 });
  VARIATIONS.push({ label: `${t.id} p2/24`, w, h, pageNumber: 2, pageCount: 24 });
  VARIATIONS.push({ label: `${t.id} p1/151`, w, h, pageNumber: 1, pageCount: 151 });
}

const PAPER = new Set([
  '#ffffff', '#fff', '#fbfaf6', '#fbf6e8', '#f4f5f7', '#eef1f5', '#eceae4',
]);

const TOL = 1.2;
let pass = 0;
let fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    const msg = `${name}${detail ? ` — ${detail}` : ''}`;
    if (failures.length < 50) failures.push(msg);
  }
};

function boundsOf(o) {
  return serializedObjectBounds({
    left: o.left,
    top: o.top,
    width: o.width,
    height: o.height,
    scaleX: o.scaleX,
    scaleY: o.scaleY,
    originX: o.originX,
    originY: o.originY,
    angle: o.angle,
    strokeWidth: o.strokeWidth,
    type: o.type,
    text: o.text,
  });
}

function fillOf(o) {
  const f = o.fill;
  return typeof f === 'string' ? f.toLowerCase() : '';
}

function dummyPage(w, h) {
  return { id: 'p', name: 'P', width: w, height: h, background: '#ffffff', data: null };
}

function audit(kind, t, chrome, v) {
  const safe = safeAreaFor(v.w, v.h, v.pageNumber, kdpMarginsFor(v.pageCount, { intent: 'safe' }));
  for (const o of chrome) {
    const bb = boundsOf(o);
    const paint = PAPER.has(fillOf(o));
    const coversPage = bb.width >= v.w * 0.9 && bb.height >= v.h * 0.9;
    const coversSafe = bb.width >= safe.width * 0.9 && bb.height >= safe.height * 0.9;
    if (paint && (coversPage || coversSafe)) {
      check(`${kind}:${t.id} @ ${v.label}: no paper paint`, false, `fill=${fillOf(o)}`);
      continue;
    }
    const ok =
      bb.left >= safe.left - TOL &&
      bb.top >= safe.top - TOL &&
      bb.left + bb.width <= safe.left + safe.width + TOL &&
      bb.top + bb.height <= safe.top + safe.height + TOL;
    check(`${kind}:${t.id} @ ${v.label}`, ok,
      `rect=[${bb.left.toFixed(1)},${bb.top.toFixed(1)},${bb.width.toFixed(1)}x${bb.height.toFixed(1)}]`);

    const label = typeof o.text === 'string' ? o.text : '';
    if (label && !label.includes('\n') && label.length <= 16) {
      const fs = Number(o.fontSize ?? 12);
      const maxW = Math.max(90, label.length * fs * 0.95 + fs);
      check(
        `${kind}:${t.id} @ ${v.label}: text hugs "${label.replace(/\s+/g, ' ')}"`,
        Number(o.width) <= maxW + 8,
        `w=${Number(o.width).toFixed(1)} max=${maxW.toFixed(1)}`,
      );
    }
  }
}

console.log(`\n=== puzzle frames  sudoku=${SUDOKU_TEMPLATES.length} ws=${WS_TEMPLATES.length} cw=${CW_TEMPLATES.length} mz=${MZ_TEMPLATES.length} ===`);

for (const t of SUDOKU_TEMPLATES) {
  for (const v of VARIATIONS) {
    let chrome;
    try {
      ({ chrome } = t.build({
        page: dummyPage(v.w, v.h),
        pageNumber: v.pageNumber,
        pageCount: v.pageCount,
        count: t.supports[0] ?? 1,
        gridSize: t.bestFor?.[0] ?? 9,
        font: 'Inter',
        kdpSafe: true,
        title: 'Sudoku',
        subtitle: 'Puzzle 1 · Medium',
        ink: '#111827',
        accent: '#2b7fb8',
      }));
    } catch (e) {
      check(`sudoku:${t.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }
    audit('sudoku', t, chrome, v);
  }
}

for (const t of WS_TEMPLATES) {
  for (const v of VARIATIONS) {
    let chrome;
    try {
      ({ chrome } = t.build({
        page: dummyPage(v.w, v.h),
        pageNumber: v.pageNumber,
        pageCount: v.pageCount,
        count: t.supports[0] ?? 1,
        gridSize: 12,
        wordCount: 12,
        bankHeight: 72,
        font: 'Inter',
        kdpSafe: true,
        title: 'Word Search',
        subtitle: 'Puzzle 1 · Animals',
        theme: 'Animals',
        ink: '#111827',
        accent: '#e08b3a',
      }));
    } catch (e) {
      check(`ws:${t.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }
    audit('ws', t, chrome, v);
  }
}

for (const t of CW_TEMPLATES) {
  for (const v of VARIATIONS) {
    let chrome;
    try {
      ({ chrome } = t.build({
        page: dummyPage(v.w, v.h),
        pageNumber: v.pageNumber,
        pageCount: v.pageCount,
        count: t.supports[0] ?? 1,
        gridSize: 13,
        clueHeight: 140,
        font: 'Inter',
        kdpSafe: true,
        title: 'Crossword',
        subtitle: 'Puzzle 1 · Medium',
        theme: 'Nature',
        level: 'medium',
        ink: '#111827',
        accent: '#2b7fb8',
      }));
    } catch (e) {
      check(`cw:${t.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }
    audit('cw', t, chrome, v);
  }
}

for (const t of MZ_TEMPLATES) {
  for (const v of VARIATIONS) {
    let chrome;
    try {
      ({ chrome } = t.build({
        page: dummyPage(v.w, v.h),
        pageNumber: v.pageNumber,
        pageCount: v.pageCount,
        count: t.supports[0] ?? 1,
        font: 'Inter',
        kdpSafe: true,
        title: 'Maze',
        subtitle: 'Maze 1 · Medium',
        difficulty: 'Medium',
        ink: '#111827',
        accent: '#2b7fb8',
      }));
    } catch (e) {
      check(`mz:${t.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }
    audit('mz', t, chrome, v);
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) {
  console.log('first leaks:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('PUZZLE FRAMES  all inside the safe box');
