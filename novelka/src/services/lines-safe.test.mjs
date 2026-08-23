/**
 * Lines & Grids leak audit — node after bundling rulings + templates.
 * Every ruling and every line-colorable page template must sit inside the
 * KDP safe box at every locked trim. Nothing paints a full-page fill.
 */
import { JSDOM } from 'jsdom';
import { installCanvasStub } from '../../test/helpers/jsdom-canvas-stub.mjs';

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
  dom.window.document.fonts = { load: async () => [], ready: Promise.resolve(), add() {}, has() { return false; }, size: 0, [Symbol.iterator]: function* () {} };
}

const { TEMPLATES, buildTemplateJSON } = await import('./templates.built.mjs');
const { RULINGS } = await import('./rulings.built.mjs');
const { kdpMarginsFor, safeAreaFor, serializedObjectBounds, inchesToPt } = await import('./kdp.built.mjs');

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
  VARIATIONS.push({ label: `${t.id} p1/24`, ctx: { w, h, font: 'Inter', pageNumber: 1, pageCount: 24 } });
  VARIATIONS.push({ label: `${t.id} p2/24`, ctx: { w, h, font: 'Inter', pageNumber: 2, pageCount: 24 } });
  VARIATIONS.push({ label: `${t.id} p1/151`, ctx: { w, h, font: 'Inter', pageNumber: 1, pageCount: 151 } });
}

const TOL = 0.75;
let pass = 0;
let fail = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    const msg = `${name}${detail ? ` — ${detail}` : ''}`;
    if (failures.length < 40) failures.push(msg);
  }
};

const lineCards = TEMPLATES.filter((t) => t.lineColorable);

console.log(`\n=== ${lineCards.length} line cards + ${RULINGS.length} rulings ===`);

for (const t of lineCards) {
  for (const v of VARIATIONS) {
    const safe = safeAreaFor(v.ctx.w, v.ctx.h, v.ctx.pageNumber, kdpMarginsFor(v.ctx.pageCount, { intent: 'safe' }));
    let objs;
    try {
      objs = await buildTemplateJSON(t, v.ctx);
    } catch (e) {
      check(`${t.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }
    for (const o of objs) {
      const bb = serializedObjectBounds(o);
      if (bb.width >= v.ctx.w * 0.95 && bb.height >= v.ctx.h * 0.95) {
        check(`${t.id} @ ${v.label}: no full-page paint`, false, 'paints the whole page');
        continue;
      }
      const ok =
        bb.left >= safe.left - TOL &&
        bb.top >= safe.top - TOL &&
        bb.left + bb.width <= safe.left + safe.width + TOL &&
        bb.top + bb.height <= safe.top + safe.height + TOL;
      check(`${t.id} @ ${v.label}`, ok,
        `rect=[${bb.left.toFixed(1)},${bb.top.toFixed(1)},${bb.width.toFixed(1)}x${bb.height.toFixed(1)}] safe=[${safe.left.toFixed(1)},${safe.top.toFixed(1)},${safe.width.toFixed(1)}x${safe.height.toFixed(1)}]`);
    }
  }
}

for (const r of RULINGS) {
  for (const v of VARIATIONS) {
    const safe = safeAreaFor(v.ctx.w, v.ctx.h, v.ctx.pageNumber, kdpMarginsFor(v.ctx.pageCount, { intent: 'safe' }));
    let objs;
    try {
      objs = r.build({
        w: v.ctx.w,
        h: v.ctx.h,
        pageNumber: v.ctx.pageNumber,
        pageCount: v.ctx.pageCount,
        color: '#c9d1dc',
        spacingScale: 1,
        weightScale: 1,
        kdpSafe: true,
        plainMargin: 36,
      });
    } catch (e) {
      check(`ruling ${r.id} builds @ ${v.label}`, false, String(e?.message ?? e));
      continue;
    }
    if (r.id === 'blank') {
      check(`ruling blank is empty @ ${v.label}`, objs.length === 0);
      continue;
    }
    check(`ruling ${r.id} produces ink @ ${v.label}`, objs.length > 0, `n=${objs.length}`);
    for (const o of objs) {
      const raw = {
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
      };
      const bb = serializedObjectBounds(raw);
      if (bb.width >= v.ctx.w * 0.95 && bb.height >= v.ctx.h * 0.95) {
        check(`ruling ${r.id} @ ${v.label}: no full-page paint`, false, 'paints the whole page');
        continue;
      }
      const ok =
        bb.left >= safe.left - TOL &&
        bb.top >= safe.top - TOL &&
        bb.left + bb.width <= safe.left + safe.width + TOL &&
        bb.top + bb.height <= safe.top + safe.height + TOL;
      check(`ruling ${r.id} @ ${v.label}`, ok,
        `rect=[${bb.left.toFixed(1)},${bb.top.toFixed(1)},${bb.width.toFixed(1)}x${bb.height.toFixed(1)}]`);
    }
  }
}

console.log(`${pass} passed, ${fail} failed`);
if (fail) {
  console.log('first leaks:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('LINES & GRIDS  all inside the safe box');
