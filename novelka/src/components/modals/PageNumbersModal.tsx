import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { FONTS } from '../../engine/font-manager';
import {
  DEFAULT_PAGE_NUMBERS,
  applyPageNumbers,
  hasPageNumbers,
  removePageNumbers,
  type NumberPosition,
  type PageNumberOptions,
} from '../../services/page-numbers';
import { useTextStyleStore } from '../../stores/text-style-store';

const POSITIONS: { v: NumberPosition; t: string }[] = [
  { v: 'bottom-center', t: 'Bottom' },
  { v: 'bottom-outer', t: 'Outer' },
  { v: 'bottom-inner', t: 'Inner' },
  { v: 'top-center', t: 'Top' },
  { v: 'top-outer', t: 'Top outer' },
];

const FORMATS = ['{n}', '— {n} —', 'Page {n}', '· {n} ·'];

export function PageNumbersModal({ onClose }: { onClose: () => void }) {
  const { pages, replaceAllPages } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const docFont = useTextStyleStore((s) => s.fontFamily);

  const [opts, setOpts] = useState<PageNumberOptions>({
    ...DEFAULT_PAGE_NUMBERS,
    fontFamily: docFont,
  });
  const [busy, setBusy] = useState(false);
  const existing = hasPageNumbers(pages);

  const set = <K extends keyof PageNumberOptions>(k: K, v: PageNumberOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const apply = async () => {
    setBusy(true);
    try {
      const next = await applyPageNumbers(pages, opts);
      await replaceAllPages(next);
      setStatus('success', 'Page numbers added');
      onClose();
    } catch {
      setStatus('error', 'Could not add page numbers');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await replaceAllPages(removePageNumbers(pages));
      setStatus('success', 'Page numbers removed');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const interior = pages.filter((p) => p.role !== 'cover');

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal ink-modal">
        <div className="modal-head">
          <span>Page numbers</span>
          <button className="btn icon ghost" type="button" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </div>

        <div className="modal-body set-body">
          <div className="set-row">
            <span>Place</span>
            <div className="chips">
              {POSITIONS.map((p) => (
                <button
                  key={p.v}
                  type="button"
                  className={`chip ${opts.position === p.v ? 'active' : ''}`}
                  onClick={() => set('position', p.v)}
                >
                  {p.t}
                </button>
              ))}
            </div>
          </div>
          <div className="set-row">
            <span>Look</span>
            <div className="chips">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`chip ${opts.format === f ? 'active' : ''}`}
                  onClick={() => set('format', f)}
                >
                  {f.replace('{n}', '7')}
                </button>
              ))}
            </div>
          </div>
          <label className="set-row">
            <span>Font</span>
            <select value={opts.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
              {FONTS.map((f) => (
                <option key={f.family} value={f.family}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="set-row">
            <span>Size</span>
            <input
              type="range" min={6} max={24}
              value={opts.fontSize}
              onChange={(e) => set('fontSize', Number(e.target.value))}
              aria-label="Number size"
            />
            <input
              type="color" value={opts.color}
              onChange={(e) => set('color', e.target.value)}
              aria-label="Number colour"
            />
          </label>
          <label className="set-row">
            <span>Edge</span>
            <input
              type="range" min={10} max={72}
              value={opts.margin}
              onChange={(e) => set('margin', Number(e.target.value))}
              aria-label="Distance from edge"
            />
          </label>
          <label className="set-row">
            <span>Start</span>
            <input
              type="number" min={1} max={Math.max(1, interior.length)}
              value={opts.startAtPage}
              onChange={(e) => set('startAtPage', Math.max(1, Number(e.target.value) || 1))}
              aria-label="Start on page"
            />
          </label>
          <p className="set-meta">Cover is never numbered.</p>
        </div>

        <div className="modal-foot">
          {existing && (
            <button className="btn ghost" type="button" onClick={() => void clear()} disabled={busy}>
              Remove
            </button>
          )}
          <div className="spacer" />
          <button className="btn primary" type="button" onClick={() => void apply()} disabled={busy}>
            {busy ? 'Applying…' : existing ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
