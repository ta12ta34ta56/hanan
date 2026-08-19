import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorUiStore } from '../../stores/editor-ui-store';
import { useThemeStore } from '../../stores/theme-store';
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
  { id: 'white', label: 'Black ink, white paper' },
  { id: 'cream', label: 'Black ink, cream paper' },
];

/**
 * Settings: BOOK-level setup (trim / paper / binding — changing them runs the
 * smart whole-book resize, never a single-page resize), a live read-only
 * cover summary derived from settings + page count, page background, and
 * workspace preferences. All state lives in the existing stores.
 */
export function SettingsPanel() {
  const { pages, activePageId, book, resizeBook, undoBookChange, bookSnapshot, setPageBackground } =
    useCanvasStore();
  const { showRulers, toggleRulers, gridSize, setGridSize } = useEditorUiStore();
  const themeChoice = useThemeStore((s) => s.choice);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [busy, setBusy] = useState(false);

  const page = pages.find((p) => p.id === activePageId) ?? pages[0];
  const interiorCount = pages.filter((p) => p.role !== 'cover').length;
  const hasCover = pages.some((p) => p.role === 'cover');
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

  /** Book-level change with confirmation — resizes the WHOLE book. */
  const applyBook = async (next: BookSettings, what: string) => {
    const trimChanged =
      Math.abs(next.trimWidth - book.trimWidth) > 0.5 ||
      Math.abs(next.trimHeight - book.trimHeight) > 0.5;
    if (trimChanged) {
      const ok = window.confirm(
        `Resize the whole book to ${(next.trimWidth / IN).toFixed(2).replace(/\.?0+$/, '')} × ${(next.trimHeight / IN).toFixed(2).replace(/\.?0+$/, '')} in?\n\nAll ${interiorCount} interior pages get the new trim, generated puzzles reflow to the new safe area, and the cover is recomputed. You can undo this from Settings.`,
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      await resizeBook(next);
    } finally {
      setBusy(false);
    }
    void what;
  };

  const applyPreset = (id: string) => {
    const t = TRIM_PRESETS.find((p) => p.id === id);
    if (!t) return;
    const w = (landscape ? Math.max(t.wIn, t.hIn) : Math.min(t.wIn, t.hIn)) * IN;
    const h = (landscape ? Math.min(t.wIn, t.hIn) : Math.max(t.wIn, t.hIn)) * IN;
    void applyBook({ ...book, trimWidth: w, trimHeight: h }, 'trim');
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Settings</span>
        <ClosePanelButton />
      </div>
      <div className="panel-body">
        <div className="section">
          <div className="section-title">Book size</div>
          <div className="stack">
            <div>
              <span className="label">Trim size (whole book)</span>
              <select value={trimId} onChange={(e) => applyPreset(e.target.value)} disabled={busy}>
                {TRIM_PRESETS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <button
              className="btn"
              disabled={busy}
              onClick={() => void applyBook({ ...book, trimWidth: book.trimHeight, trimHeight: book.trimWidth }, 'orientation')}
            >
              Swap orientation ({landscape ? 'landscape' : 'portrait'})
            </button>
            <p className="hint" style={{ margin: 0 }}>
              Resizing is book-wide: every interior page, generated layouts and
              the cover change together.
            </p>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Paper &amp; binding</div>
          <div className="stack">
            <div>
              <span className="label">Paper type</span>
              <select
                value={book.paper}
                disabled={busy}
                onChange={(e) => void applyBook({ ...book, paper: e.target.value as PaperType }, 'paper')}
              >
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Binding</span>
              <select
                value={book.binding}
                disabled={busy}
                onChange={(e) => void applyBook({ ...book, binding: e.target.value as BindingType }, 'binding')}
              >
                <option value="paperback">Paperback</option>
                <option value="hardcover">Hardcover</option>
              </select>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Cover</div>
          <div className="cover-summary">
            <div className="row between"><span className="hint">Flat size</span><strong>{formatIn(spec.totalWidth, 2)} × {formatIn(spec.totalHeight, 2)}</strong></div>
            <div className="row between"><span className="hint">Spine</span><strong>{formatIn(spec.spine)}</strong></div>
            <div className="row between"><span className="hint">Spine text</span><strong>{spec.spineTextAllowed ? 'Allowed' : `Needs > 79 pages (${interiorCount} now)`}</strong></div>
            <div className="row between"><span className="hint">Pages</span><strong>{interiorCount} ({limits.min}–{limits.max} allowed)</strong></div>
            {!hasCover && (
              <p className="hint" style={{ marginTop: 6 }}>
                No cover page yet — add one via the ⋯ menu (Cover creation).
              </p>
            )}
            {hasCover && (
              <p className="hint" style={{ marginTop: 6 }}>
                The cover page tracks these figures automatically as pages are
                added or removed.
              </p>
            )}
          </div>
        </div>

        {bookSnapshot && (
          <div className="section">
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => void undoBookChange()}>
              <Icon name="undo" size={14} /> Undo last book change
            </button>
          </div>
        )}

        <div className="section">
          <div className="section-title">Page background</div>
          <div className="row between">
            <span className="label" style={{ margin: 0 }}>This page</span>
            <div className="row" style={{ gap: 6 }}>
              <input
                type="color"
                value={page.background ?? '#ffffff'}
                onChange={(e) => setPageBackground(e.target.value)}
                style={{ width: 46 }}
              />
              <button
                className={`btn sm ${page.background === null ? 'active' : ''}`}
                title="Transparent background"
                aria-label="Transparent background"
                onClick={() => setPageBackground(page.background === null ? '#ffffff' : null)}
              >
                <Icon name="transparent" size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Workspace</div>
          <div className="stack">
            <label className="toggle-row">
              <span>Rulers</span>
              <input type="checkbox" checked={showRulers} onChange={toggleRulers} />
            </label>
            <div className="row between">
              <span className="label" style={{ margin: 0 }}>Grid size (pt)</span>
              <input
                type="number"
                min={4}
                max={144}
                value={gridSize}
                onChange={(e) => setGridSize(Math.max(4, Number(e.target.value) || 20))}
                style={{ width: 70 }}
              />
            </div>
            <button className="btn" onClick={toggleTheme}>
              <Icon name={themeChoice === 'light' ? 'sun' : 'moon'} size={14} /> Theme:{' '}
              {themeChoice === 'light' ? 'Light' : 'Dark'} — switch
            </button>
          </div>
        </div>

        <p className="hint">
          Safe area, gutter, bleed, snapping and grid visibility live in the
          bar under the canvas.
        </p>
      </div>
    </div>
  );
}
