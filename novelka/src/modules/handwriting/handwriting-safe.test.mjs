/**
 * Handwriting leak / paper / text / thin-line audit.
 * Every design must sit inside the KDP safe box at every locked trim.
 * Titles hug their words. Nothing paints a cream/white sheet over the paper.
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

const { HW_TEMPLATES } = await import('./templates.built.mjs');
const { kdpMarginsFor, safeAreaFor, serializedObjectBounds, inchesToPt, printedStrokeWidth } =
  await import('../../services/kdp.built.mjs');

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
  '#ffffff', '#fff', '#fbfaf6', '#fbf6e8', '#f4f5f7', '#eef1f5',
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

function walk(o, fn) {
  fn(o);
  const kids = o.objects ?? o._objects;
  if (Array.isArray(kids)) kids.forEach((k) => walk(k, fn));
}

console.log(`\n=== handwriting frames  designs=${HW_TEMPLATES.length} ===`);

for (const t of HW_TEMPLATES) {
  for (const v of VARIATIONS) {
    let chrome;
    try {
      ({ chrome } = t.build({
        page: dummyPage(v.w, v.h),
        pageNumber: v.pageNumber,
        pageCount: v.pageCount,
        title: 'A a',
        char: 'A',
        rows: 3,
        font: 'Inter',
        kdpSafe: true,
        ink: '#111827',
        accent: '#2b7fb8',
        word: 'Apple',
        phrase: 'A is for Apple',
      }));
    } catch (e) {
      check(`hw:${t.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }

    const safe = safeAreaFor(v.w, v.h, v.pageNumber, kdpMarginsFor(v.pageCount, { intent: 'safe' }));
    for (const o of chrome) {
      const bb = boundsOf(o);
      const paint = PAPER.has(fillOf(o));
      const coversPage = bb.width >= v.w * 0.9 && bb.height >= v.h * 0.9;
      const coversSafe = bb.width >= safe.width * 0.9 && bb.height >= safe.height * 0.9;
      if (paint && (coversPage || coversSafe)) {
        check(`hw:${t.id} @ ${v.label}: no paper paint`, false, `fill=${fillOf(o)}`);
        continue;
      }
      const ok =
        bb.left >= safe.left - TOL &&
        bb.top >= safe.top - TOL &&
        bb.left + bb.width <= safe.left + safe.width + TOL &&
        bb.top + bb.height <= safe.top + safe.height + TOL;
      check(`hw:${t.id} @ ${v.label}`, ok,
        `rect=[${bb.left.toFixed(1)},${bb.top.toFixed(1)},${bb.width.toFixed(1)}x${bb.height.toFixed(1)}]`);

      const label = typeof o.text === 'string' ? o.text : '';
      if (label && !label.includes('\n') && label.length <= 16) {
        const fs = Number(o.fontSize ?? 12);
        const maxW = Math.max(90, label.length * fs * 0.95 + fs);
        check(
          `hw:${t.id} @ ${v.label}: text hugs "${label.replace(/\s+/g, ' ')}"`,
          Number(o.width) <= maxW + 8,
          `w=${Number(o.width).toFixed(1)} max=${maxW.toFixed(1)}`,
        );
      }

      walk(o, (node) => {
        const stroke = typeof node.stroke === 'string' && node.stroke !== '' && node.stroke !== 'transparent';
        const printed = printedStrokeWidth(node);
        if (stroke && printed > 0) {
          check(
            `hw:${t.id} @ ${v.label}: stroke >= 0.75`,
            printed >= 0.75 - 0.001,
            `printed=${printed.toFixed(2)}`,
          );
        }
      });
    }
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) {
  console.log('first leaks:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('HANDWRITING  all inside the safe box');
