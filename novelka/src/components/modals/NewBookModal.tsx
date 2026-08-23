import { useMemo, useState } from 'react';
import { IN } from '../../types/canvas.types';
import {
  TRIM_PRESETS,
  coverSpecFor,
  pageCountLimits,
  type BookSettings,
} from '../../services/book';
import { formatIn, type BindingType, type PaperType } from '../../services/kdp-cover';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';

const PAPERS: { id: PaperType; label: string }[] = [
  { id: 'white', label: 'White' },
  { id: 'cream', label: 'Cream' },
];

/**
 * One small window before the editor. Title → paper → cover → trim → pages.
 * Cover toggle is once. KDP text only when the count is out of range.
 */
export function NewBookModal({
  initialName,
  onClose,
  onCreated,
}: {
  initialName?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const newBook = useCanvasStore((s) => s.newBook);
  const setStatus = useToastStore((s) => s.setStatus);

  const [trimId, setTrimId] = useState('kdp6x9');
  const [paper, setPaper] = useState<PaperType>('white');
  const [binding, setBinding] = useState<BindingType>('paperback');
  const [includeCover, setIncludeCover] = useState(true);
  const [pageCount, setPageCount] = useState(24);
  const [name, setName] = useState(initialName ?? 'New Book');
  const [busy, setBusy] = useState(false);

  const preset = TRIM_PRESETS.find((t) => t.id === trimId) ?? TRIM_PRESETS[0];
  const settings: BookSettings = useMemo(
    () => ({ trimWidth: preset.wIn * IN, trimHeight: preset.hIn * IN, paper, binding }),
    [preset.wIn, preset.hIn, paper, binding],
  );
  const limits = pageCountLimits(settings);
  const spec = useMemo(() => coverSpecFor(settings, pageCount), [settings, pageCount]);
  const countLow = pageCount < limits.min;
  const countHigh = pageCount > limits.max;

  const create = async () => {
    setBusy(true);
    try {
      await newBook({
        name: name.trim() || 'New Book',
        settings,
        pageCount: Math.max(1, pageCount),
        includeCover,
      });
      setStatus('success', includeCover ? `Book created — spine ${formatIn(spec.spine)}` : 'Book created');
      onCreated();
    } catch {
      setStatus('error', 'Could not create the book');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal ink-modal">
        <div className="modal-head">
          <span>New book</span>
          <button className="btn icon ghost" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <label className="set-row">
            <span>Title</span>
            <input
              placeholder="New Book"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Book title"
              autoFocus
            />
          </label>

          <div className="set-row">
            <span>Paper</span>
            <div className="chips">
              {PAPERS.map((p) => (
                <button key={p.id} type="button" className={`chip ${paper === p.id ? 'active' : ''}`} onClick={() => setPaper(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="toggle-row">
            <span>Cover</span>
            <input
              type="checkbox"
              checked={includeCover}
              onChange={(e) => setIncludeCover(e.target.checked)}
            />
          </label>
          {includeCover && (
            <div className="chips" style={{ marginLeft: 'auto' }}>
              <button type="button" className={`chip ${binding === 'paperback' ? 'active' : ''}`} onClick={() => setBinding('paperback')}>Paperback</button>
              <button type="button" className={`chip ${binding === 'hardcover' ? 'active' : ''}`} onClick={() => setBinding('hardcover')}>Hardcover</button>
            </div>
          )}

          <label className="set-row">
            <span>Trim</span>
            <select value={trimId} onChange={(e) => setTrimId(e.target.value)} aria-label="Trim size">
              {TRIM_PRESETS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className="set-row">
            <span>Pages</span>
            <input
              type="number"
              min={1}
              max={limits.max}
              value={pageCount}
              onChange={(e) => setPageCount(Math.max(1, Math.round(Number(e.target.value) || 1)))}
              aria-label="Interior page count"
            />
          </label>

          {(countLow || countHigh) && (
            <p className="newbook-guidance warn">
              {countLow
                ? `Need at least ${limits.min} pages for ${binding}.`
                : `At most ${limits.max} pages for this paper.`}
            </p>
          )}
          {includeCover && !countLow && !countHigh && (
            <p className="set-meta">Spine {formatIn(spec.spine)}</p>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={() => void create()} disabled={busy}>
            {busy ? 'Creating…' : 'Create book'}
          </button>
        </div>
      </div>
    </div>
  );
}
