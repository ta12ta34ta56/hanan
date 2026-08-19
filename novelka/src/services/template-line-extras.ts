import * as fabric from 'fabric';
import { kdpMarginsFor, safeAreaFor } from './kdp';
import { IN } from '../types/canvas.types';
import type { TemplateContext, TemplateDef } from './template-types';

const RULE = '#c9d1dc';
const FAINT = '#dfe5ec';

const line = (x1: number, y1: number, x2: number, y2: number, stroke = RULE, w = 1) =>
  new fabric.Line([x1, y1, x2, y2], { stroke, strokeWidth: w, selectable: true });

function area(ctx: TemplateContext) {
  const m = kdpMarginsFor(ctx.pageCount);
  return safeAreaFor(ctx.w, ctx.h, ctx.pageNumber, m);
}

export const dottedWide: TemplateDef = {
  id: 'dotted-wide',
  name: 'Dot grid (Wide)',
  category: 'interior',
  accessLevel: 'free',
  kdpSafe: true,
  lineColorable: true,
  variantGroup: 'dotted',
  variantLabel: 'Wide',
  description: 'Wider bullet-journal dots.',
  preview: `<rect width="100" height="141" fill="#fff"/>${Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => `<circle cx="${16 + c * 9.5}" cy="${20 + r * 11}" r="1.15" fill="#b9c2cf"/>`).join(''),
  ).join('')}`,
  build: async ({ w, h, font, pageNumber, pageCount }) => {
    const a = area({ w, h, font, pageNumber, pageCount });
    const step = 7 * (IN / 25.4);
    const objs: fabric.FabricObject[] = [];
    for (let y = a.top; y <= a.top + a.height; y += step) {
      for (let x = a.left; x <= a.left + a.width; x += step) {
        objs.push(new fabric.Circle({ left: x, top: y, radius: 1.15, fill: '#b9c2cf', originX: 'center', originY: 'center' }));
      }
    }
    return objs;
  },
};

export const dottedBold: TemplateDef = {
  id: 'dotted-bold',
  name: 'Dot grid (Bold)',
  category: 'interior',
  accessLevel: 'free',
  kdpSafe: true,
  lineColorable: true,
  variantGroup: 'dotted',
  variantLabel: 'Bold',
  description: 'Heavier dots, slightly wider.',
  preview: `<rect width="100" height="141" fill="#fff"/>${Array.from({ length: 12 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => `<circle cx="${16 + c * 8.5}" cy="${20 + r * 9.5}" r="1.35" fill="#b9c2cf"/>`).join(''),
  ).join('')}`,
  build: async ({ w, h, font, pageNumber, pageCount }) => {
    const a = area({ w, h, font, pageNumber, pageCount });
    const step = 6 * (IN / 25.4);
    const objs: fabric.FabricObject[] = [];
    for (let y = a.top; y <= a.top + a.height; y += step) {
      for (let x = a.left; x <= a.left + a.width; x += step) {
        objs.push(new fabric.Circle({ left: x, top: y, radius: 1.35, fill: '#b9c2cf', originX: 'center', originY: 'center' }));
      }
    }
    return objs;
  },
};

export const graphWide: TemplateDef = {
  id: 'graph-wide',
  name: 'Graph paper (Wide)',
  category: 'interior',
  accessLevel: 'free',
  kdpSafe: true,
  lineColorable: true,
  variantGroup: 'graph',
  variantLabel: 'Wide',
  description: 'Wider graph squares.',
  preview: `<rect width="100" height="141" fill="#fff"/>${[
    ...Array.from({ length: 9 }, (_, i) => `<rect x="14" y="${18 + i * 12}" width="72" height="0.5" fill="#dfe5ec"/>`),
    ...Array.from({ length: 7 }, (_, i) => `<rect x="${14 + i * 12}" y="18" width="0.5" height="103" fill="#dfe5ec"/>`),
  ].join('')}`,
  build: async ({ w, h, font, pageNumber, pageCount }) => {
    const a = area({ w, h, font, pageNumber, pageCount });
    const step = 7 * (IN / 25.4);
    const objs: fabric.FabricObject[] = [];
    for (let y = a.top; y <= a.top + a.height; y += step) objs.push(line(a.left, y, a.left + a.width, y, FAINT, 0.75));
    for (let x = a.left; x <= a.left + a.width; x += step) objs.push(line(x, a.top, x, a.top + a.height, FAINT, 0.75));
    return objs;
  },
};

export const graphBold: TemplateDef = {
  id: 'graph-bold',
  name: 'Graph paper (Bold)',
  category: 'interior',
  accessLevel: 'free',
  kdpSafe: true,
  lineColorable: true,
  variantGroup: 'graph',
  variantLabel: 'Bold',
  description: 'Thicker graph lines.',
  preview: `<rect width="100" height="141" fill="#fff"/>${[
    ...Array.from({ length: 10 }, (_, i) => `<rect x="14" y="${18 + i * 10.5}" width="72" height="1.1" fill="#dfe5ec"/>`),
    ...Array.from({ length: 8 }, (_, i) => `<rect x="${14 + i * 10.5}" y="18" width="1.1" height="103" fill="#dfe5ec"/>`),
  ].join('')}`,
  build: async ({ w, h, font, pageNumber, pageCount }) => {
    const a = area({ w, h, font, pageNumber, pageCount });
    const step = 6 * (IN / 25.4);
    const objs: fabric.FabricObject[] = [];
    for (let y = a.top; y <= a.top + a.height; y += step) objs.push(line(a.left, y, a.left + a.width, y, FAINT, 1.6));
    for (let x = a.left; x <= a.left + a.width; x += step) objs.push(line(x, a.top, x, a.top + a.height, FAINT, 1.6));
    return objs;
  },
};

export const halfLinedWide: TemplateDef = {
  id: 'half-lined-wide',
  name: 'Sketch + write (Wide)',
  category: 'interior',
  accessLevel: 'free',
  kdpSafe: true,
  lineColorable: true,
  variantGroup: 'half-lined',
  variantLabel: 'Wide',
  description: 'Wider writing lines under the sketch box.',
  preview: `<rect width="100" height="141" fill="#fff"/><rect x="14" y="16" width="72" height="55" fill="none" stroke="#c9d1dc"/>${Array.from({ length: 5 }, (_, i) => `<rect x="14" y="${80 + i * 10}" width="72" height="0.8" fill="#c9d1dc"/>`).join('')}`,
  build: async ({ w, h, font, pageNumber, pageCount }) => {
    const a = area({ w, h, font, pageNumber, pageCount });
    const boxH = a.height * 0.46;
    const objs: fabric.FabricObject[] = [
      new fabric.Rect({ left: a.left, top: a.top, width: a.width, height: boxH, fill: null, stroke: RULE, strokeWidth: 1.2, rx: 4, ry: 4 }),
    ];
    const gap = 0.42 * IN;
    for (let y = a.top + boxH + gap; y <= a.top + a.height; y += gap) objs.push(line(a.left, y, a.left + a.width, y, RULE, 1.1));
    return objs;
  },
};

export const halfLinedBold: TemplateDef = {
  id: 'half-lined-bold',
  name: 'Sketch + write (Bold)',
  category: 'interior',
  accessLevel: 'free',
  kdpSafe: true,
  lineColorable: true,
  variantGroup: 'half-lined',
  variantLabel: 'Bold',
  description: 'Thicker writing lines under the sketch box.',
  preview: `<rect width="100" height="141" fill="#fff"/><rect x="14" y="16" width="72" height="55" fill="none" stroke="#c9d1dc" stroke-width="2"/>${Array.from({ length: 7 }, (_, i) => `<rect x="14" y="${80 + i * 7}" width="72" height="1.4" fill="#c9d1dc"/>`).join('')}`,
  build: async ({ w, h, font, pageNumber, pageCount }) => {
    const a = area({ w, h, font, pageNumber, pageCount });
    const boxH = a.height * 0.46;
    const objs: fabric.FabricObject[] = [
      new fabric.Rect({ left: a.left, top: a.top, width: a.width, height: boxH, fill: null, stroke: RULE, strokeWidth: 2, rx: 4, ry: 4 }),
    ];
    const gap = 0.32 * IN;
    for (let y = a.top + boxH + gap; y <= a.top + a.height; y += gap) objs.push(line(a.left, y, a.left + a.width, y, RULE, 2));
    return objs;
  },
};

export const LINE_EXTRAS: TemplateDef[] = [
  dottedWide, dottedBold, graphWide, graphBold, halfLinedWide, halfLinedBold,
];
