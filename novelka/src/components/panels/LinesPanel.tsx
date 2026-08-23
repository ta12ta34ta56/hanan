import { useMemo, useState } from 'react';
import * as fabric from 'fabric';
import {
  DEFAULT_RULING_CTX,
  RULINGS,
  RULING_GROUPS,
  type RulingDef,
} from '../../services/rulings';
import { interiorPageCount, interiorPageNumber } from '../../services/template-groups';
import { withPageRulingRecipe } from '../../services/page-recipe';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { engine } from '../../engine/canvas-engine';
import { IN } from '../../types/canvas.types';
import { SafeSvgPreview } from '../SafeSvgPreview';

type Scope = 'page' | 'all' | 'blank';
type RulingGroup = RulingDef['group'];

/** Tag used to mark objects that belong to the last applied ruling. */
const RULING_TAG = 'novelka:ruling';

const COLORS = [
  { c: '#c9d1dc', n: 'Light grey' },
  { c: '#9aa4b5', n: 'Grey' },
  { c: '#6b7280', n: 'Dark grey' },
  { c: '#111827', n: 'Black' },
  { c: '#93c5fd', n: 'Blue' },
  { c: '#fca5a5', n: 'Red' },
  { c: '#86efac', n: 'Green' },
  { c: '#d8b4fe', n: 'Purple' },
];

const SPACING_PRESETS = [
  { id: 'narrow', label: 'Narrow', value: 0.8 },
  { id: 'standard', label: 'Standard', value: 1 },
  { id: 'wide', label: 'Wide', value: 1.25 },
];

const GROUP_FILTERS: { key: 'all' | RulingGroup; label: string }[] = [
  { key: 'all', label: 'All' },
  ...RULING_GROUPS.map((g) => ({ key: g.key, label: g.key === 'grid' ? 'Grids' : g.label.replace(' lines', '') })),
];

function rulingObjectsToJSON(objs: fabric.FabricObject[]) {
  return objs.map((o) => o.toObject(['id', 'elementType', 'name', 'locked']));
}

/**
 * Lines & Grids.
 *
 * Workflow (owner lock): set Apply to in the left rail, maybe open Customize
 * for colour / spacing / weight, then click a card. The card applies and the
 * window closes. No second “Apply line pattern” step. No live rebuild while
 * they drag sliders — that made the window lag and glitch.
 */
export function LinesPanel({
  embedded = false,
  scope = 'page',
  replace = true,
  onApplied,
}: {
  embedded?: boolean;
  scope?: Scope;
  replace?: boolean;
  onApplied?: () => void;
} = {}) {
  const { pages, activePageId, replaceAllPages, commit } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);

  const [group, setGroup] = useState<'all' | RulingGroup>('all');
  const [color, setColor] = useState(DEFAULT_RULING_CTX.color);
  const [spacing, setSpacing] = useState(1);
  const [weight, setWeight] = useState(1);
  const kdpSafe = true;
  const [busy, setBusy] = useState(false);

  const list = useMemo(
    () => (group === 'all' ? RULINGS : RULINGS.filter((r) => r.group === group)),
    [group],
  );

  const ctxFor = (w: number, h: number, pageNumber: number, pageCount: number) => ({
    w,
    h,
    pageNumber,
    pageCount,
    color,
    spacingScale: spacing,
    weightScale: weight,
    kdpSafe,
    plainMargin: 0.5 * IN,
  });

  const tagObjects = (objs: fabric.FabricObject[]) =>
    objs.forEach((o) => ((o as unknown as { name: string }).name = RULING_TAG));

  const applyOne = async (r: RulingDef) => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (pages[idx]?.role === 'cover') {
      setStatus('error', 'Line templates are for interior pages. The cover is separate.');
      return false;
    }
    const c = engine.requireCanvas();
    await engine.silent(() => {
      if (replace) c.remove(...c.getObjects());
      const objs = r.build(ctxFor(engine.pageWidth, engine.pageHeight, interiorPageNumber(pages, idx), interiorPageCount(pages)));
      tagObjects(objs);
      objs.forEach((o) => c.add(o));
      const paper = pages[idx]?.background;
      if (paper) engine.setBackground(paper);
      c.requestRenderAll();
    });
    if (replace) {
      const store = useCanvasStore.getState();
      const current = store.pages.map((p) =>
        p.id === activePageId
          ? withPageRulingRecipe(p, { rulingId: r.id, color, spacing, weight })
          : p,
      );
      useCanvasStore.setState({ pages: current });
    }
    commit(`Ruling: ${r.name}`);
    return true;
  };

  const applyMany = async (r: RulingDef, onlyBlank: boolean) => {
    useCanvasStore.getState().syncActivePage();
    const current = useCanvasStore.getState().pages;
    const next: typeof current = [];

    for (let i = 0; i < current.length; i++) {
      const page = current[i];
      if (page.role === 'cover') {
        next.push(page);
        continue;
      }
      const existing =
        ((page.data as { objects?: unknown[] } | null)?.objects ?? []) as unknown[];
      if (onlyBlank && existing.length > 0) {
        next.push(page);
        continue;
      }

      const objs = r.build(ctxFor(page.width, page.height, interiorPageNumber(current, i), interiorPageCount(current)));
      tagObjects(objs);
      const json = rulingObjectsToJSON(objs);

      const stamped = {
        ...page,
        data: {
          version: '6.0.0',
          background: page.background ?? '#ffffff',
          objects: replace ? json : [...json, ...existing],
        },
      };
      next.push(
        replace
          ? withPageRulingRecipe(stamped, { rulingId: r.id, color, spacing, weight })
          : stamped,
      );

      if (i % 8 === 7) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    }
    await replaceAllPages(next);
    return true;
  };

  const applyRuling = async (r: RulingDef) => {
    setBusy(true);
    try {
      if (scope === 'page') {
        setStatus('busy', `Applying ${r.name}…`);
        const ok = await applyOne(r);
        if (!ok) return false;
        setStatus('success', `${r.name} applied`);
      } else {
        setStatus('busy', `Applying ${r.name}…`);
        await applyMany(r, scope === 'blank');
        setStatus('success', `${r.name} applied to ${scope === 'blank' ? 'blank' : 'all'} pages`);
      }
      return true;
    } catch {
      setStatus('error', 'Could not apply that pattern');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pickCard = async (r: RulingDef) => {
    const ok = await applyRuling(r);
    if (ok) onApplied?.();
  };

  const content = (
    <>
      <div className={embedded ? undefined : 'panel-body'}>
        <details className="section" style={{ marginBottom: 14 }}>
          <summary className="section-title">Customize</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            <div>
              <span className="label">Line colour</span>
              <div className="swatches" style={{ marginBottom: 10 }}>
                {COLORS.map((c) => (
                  <button
                    key={c.c}
                    className={`swatch ${color === c.c ? 'on' : ''}`}
                    style={{ background: c.c }}
                    title={c.n}
                    onClick={() => setColor(c.c)}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 26, height: 20, padding: 1 }}
                  title="Custom colour" aria-label="Custom colour"
                />
              </div>
            </div>

            <div>
              <span className="label">Spacing</span>
              <div className="chips">
                {SPACING_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={`chip ${Math.abs(spacing - p.value) < 0.01 ? 'active' : ''}`}
                    onClick={() => setSpacing(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <input
                  type="number"
                  min={0.6}
                  max={2}
                  step={0.05}
                  value={spacing}
                  onChange={(e) => setSpacing(Math.max(0.6, Math.min(2, Number(e.target.value) || 1)))}
                  aria-label="Custom spacing multiplier"
                />
              </div>
            </div>

            <div>
              <span className="label">Line weight — {weight.toFixed(2)}×</span>
              <input
                type="range" min={0.5} max={3} step={0.1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
          </div>
        </details>

        <div className="chips" style={{ marginBottom: 12 }}>
          {GROUP_FILTERS.map((g) => (
            <button
              key={g.key}
              className={`chip ${group === g.key ? 'active' : ''}`}
              onClick={() => setGroup(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className={embedded ? 'tpl-lib-grid' : 'grid-3'}>
          {list.map((r) => (
            <button
              key={r.id}
              className={embedded ? 'tpl-lib-card' : 'ruling-card'}
              onClick={() => void pickCard(r)}
              disabled={busy}
              title={`${r.spec} · ${r.group}`}
            >
              {embedded ? (
                <>
                  <div className="tpl-lib-art">
                    <div className="tpl-lib-prev" style={{ color }}>
                      <SafeSvgPreview viewBox="0 0 100 100" markup={r.preview} />
                    </div>
                  </div>
                  <div className="tpl-lib-cap">
                    <span className="tpl-lib-name">{r.name}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="ruling-prev" style={{ color }}>
                    <SafeSvgPreview viewBox="0 0 100 100" markup={r.preview} />
                    {r.accessLevel === 'ad_unlock' && <span className="tile-lock">AD</span>}
                    {r.accessLevel === 'premium_only' && <span className="tile-lock pro">PRO</span>}
                  </div>
                  <div className="cap">{r.name}</div>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Lines &amp; grids</span>
        <span className="badge">{list.length}</span>
      </div>
      {content}
    </div>
  );
}
