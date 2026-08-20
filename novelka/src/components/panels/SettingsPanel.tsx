import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorUiStore } from '../../stores/editor-ui-store';
import { IN } from '../../types/canvas.types';
import {
  TRIM_PRESETS,
  coverSpecFor,
  pageCountLimits,
  type BookSettings,
} from '../../services/book';
import { formatIn, type BindingType, type PaperType } from '../../services/kdp-cover';
import { Icon } from '../Icon';
import { ClosePanelButton } from '../ClosePanelButton';

const PAPERS: { id: PaperType; label: string }[] = [
  { id: 'white', label: 'White' },
  { id: 'cream', label: 'Cream' },
];

/**
 * Book setup only. Theme lives in ⋯. Cover numbers are one line — the cover
 * window is where you make a cover.
 */
export function SettingsPanel() {
  const { pages, activePageId, book, resizeBook, undoBookChange, bookSnapshot, setPageBackground } =
    useCanvasStore();
  const { showRulers, toggleRulers, gridSize, setGridSize } = useEditorUiStore();
  const [busy, setBusy] = useState(false);

  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const interiorCount = pages.filter((p) => p.role !== 'cover').length;
  const spec = coverSpecFor(book, interiorCount);
  const limits = pageCountLimits(book);

  const wIn = book.trimWidth / IN;
  const hIn = book.trimHeight / IN;
  const eq = (a: number, b: number) => Math.abs(a - b) < 0.01;
  const trimId =
    TRIM_PRESETS.find(
      (t) => (eq(t.wIn, wIn) && eq(t.hIn, hIn)) || (eq(t.wIn, hIn) && eq(t.hIn, wIn)),
    )?.id ?? TRIM_PRESETS[0].id;
  const landscape = wIn > hIn;

  const applyBook = async (next: BookSettings) => {
    const trimChanged =
      Math.abs(next.trimWidth - book.trimWidth) > 0.5 ||
      Math.abs(next.trimHeight - book.trimHeight) > 0.5;
    if (trimChanged) {
      const ok = window.confirm(
        `Resize the whole book to ${(next.trimWidth / IN).toFixed(2).replace(/\.?0+$/, '')} × ${(next.trimHeight / IN).toFixed(2).replace(/\.?0+$/, '')} in?`,
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      await resizeBook(next);
    } finally {
      setBusy(false);
    }
  };

  const applyPreset = (id: string) => {
    const t = TRIM_PRESETS.find((p) => p.id === id);
    if (!t) return;
    const w = (landscape ? Math.max(t.wIn, t.hIn) : Math.min(t.wIn, t.hIn)) * IN;
    const h = (landscape ? Math.min(t.wIn, t.hIn) : Math.max(t.wIn, t.hIn)) * IN;
    void applyBook({ ...book, trimWidth: w, trimHeight: h });
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Settings</span>
        <ClosePanelButton />
      </div>
      <div className="panel-body set-body">
        <label className="set-row">
          <span>Trim</span>
          <select value={trimId} onChange={(e) => applyPreset(e.target.value)} disabled={busy}>
            {TRIM_PRESETS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <button
          className="ink-quiet-btn ghost"
          type="button"
          disabled={busy}
          onClick={() => void applyBook({ ...book, trimWidth: book.trimHeight, trimHeight: book.trimWidth })}
        >
          {landscape ? 'Portrait' : 'Landscape'}
        </button>

        <div className="set-row">
          <span>Paper</span>
          <div className="chips">
            {PAPERS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${book.paper === p.id ? 'active' : ''}`}
                disabled={busy}
                onClick={() => void applyBook({ ...book, paper: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="set-row">
          <span>Bind</span>
          <div className="chips">
            <button type="button" className={`chip ${book.binding === 'paperback' ? 'active' : ''}`} disabled={busy} onClick={() => void applyBook({ ...book, binding: 'paperback' })}>Paper</button>
            <button type="button" className={`chip ${book.binding === 'hardcover' ? 'active' : ''}`} disabled={busy} onClick={() => void applyBook({ ...book, binding: 'hardcover' as BindingType })}>Hard</button>
          </div>
        </div>

        <p className="set-meta">
          {interiorCount} pages · spine {formatIn(spec.spine)} · {limits.min}–{limits.max}
        </p>

        {bookSnapshot && (
          <button className="ink-quiet-btn ghost" type="button" onClick={() => void undoBookChange()}>
            <Icon name="undo" size={13} /> Undo book change
          </button>
        )}

        <label className="set-row">
          <span>Page</span>
          <span className="set-inline">
            <input
              type="color"
              value={page.background ?? '#ffffff'}
              onChange={(e) => setPageBackground(e.target.value)}
              aria-label="This page colour"
            />
            <button
              className={`btn sm ghost ${page.background === null ? 'active' : ''}`}
              type="button"
              title="Clear page colour"
              aria-label="Clear page colour"
              onClick={() => setPageBackground(page.background === null ? '#ffffff' : null)}
            >
              <Icon name="transparent" size={13} />
            </button>
          </span>
        </label>
        <label className="toggle-row">
          <span>Rulers</span>
          <input type="checkbox" checked={showRulers} onChange={toggleRulers} />
        </label>
        <label className="set-row">
          <span>Grid</span>
          <input
            type="number"
            min={4}
            max={144}
            value={gridSize}
            onChange={(e) => setGridSize(Math.max(4, Number(e.target.value) || 20))}
            aria-label="Grid size"
          />
        </label>
      </div>
    </div>
  );
}
