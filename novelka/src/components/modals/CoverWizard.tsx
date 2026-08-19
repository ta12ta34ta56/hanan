import { useMemo, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { loadFont } from '../../engine/font-manager';
import {
  PAPER_STOCKS,
  calculateCover,
  coverZones,
  formatIn,
  type BindingType,
  type PaperType,
} from '../../services/kdp-cover';
import { buildCoverObjects } from '../../services/book';
import { IN } from '../../types/canvas.types';

const OFFERED_PAPER = PAPER_STOCKS.filter((s) => s.id === 'white' || s.id === 'cream');

/**
 * Cover creation — trim and page count come from the book. Paper is white
 * or cream. Binding is paperback / hardcover.
 */
export function CoverWizard({ onClose }: { onClose: () => void }) {
  const { pages, addCoverPage, book, resizeBook, projectName } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const existingCover = pages.find((p) => p.role === 'cover');
  const interiorCount = pages.filter((p) => p.role !== 'cover').length;
  const font = useTextStyleStore((s) => s.fontFamily);

  const paperDefault: PaperType = book.paper === 'cream' ? 'cream' : 'white';
  const [paper, setPaper] = useState<PaperType>(paperDefault);
  const [binding, setBinding] = useState<BindingType>(book.binding);
  const [bgColor, setBgColor] = useState('#2a2f38');
  const [busy, setBusy] = useState(false);

  const spec = useMemo(
    () =>
      calculateCover(
        book.trimWidth / IN,
        book.trimHeight / IN,
        Math.max(1, interiorCount),
        paper,
        binding,
      ),
    [book.trimWidth, book.trimHeight, interiorCount, paper, binding],
  );

  const create = async () => {
    setBusy(true);
    try {
      await loadFont(font);
      const objs = buildCoverObjects(spec, {
        font,
        bgColor,
        title: projectName.trim() || 'YOUR TITLE',
      });

      await addCoverPage({
        name: 'Cover',
        width: spec.totalWidth,
        height: spec.totalHeight,
        objects: objs,
      });

      if (paper !== book.paper || binding !== book.binding) {
        await resizeBook({ ...book, paper, binding });
      }

      setStatus('success', `Cover created — spine ${formatIn(spec.spine)}`);
      onClose();
    } catch {
      setStatus('error', 'Could not create the cover');
    } finally {
      setBusy(false);
    }
  };

  const dW = 380;
  const k = dW / spec.totalWidth;
  const trimLabel = `${(book.trimWidth / IN).toFixed(book.trimWidth % IN ? 2 : 0)} × ${(book.trimHeight / IN).toFixed(book.trimHeight % IN ? 2 : 0)}`;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal wide">
        <div className="modal-head">
          <span>Cover creation</span>
          <button className="btn icon ghost" onClick={onClose} disabled={busy}>✕</button>
        </div>

        <div className="modal-body">
          <div className="cover-diagram" style={{ width: dW, height: spec.totalHeight * k }}>
            <div className="cd-bleed" />
            {coverZones(spec).map((z) => (
              <div
                key={z.id}
                className={`cd-zone ${z.id}`}
                style={{
                  left: z.left * k,
                  top: z.top * k,
                  width: z.width * k,
                  height: z.height * k,
                }}
              >
                <span>{z.id === 'spine' ? '' : z.id.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="cover-figures">
            <div><span className="hint">Trim</span><strong>{trimLabel} in</strong></div>
            <div><span className="hint">Pages</span><strong>{interiorCount}</strong></div>
            <div><span className="hint">Spine</span><strong>{formatIn(spec.spine)}</strong></div>
            <div><span className="hint">Full cover</span><strong>{formatIn(spec.totalWidth, 2)} × {formatIn(spec.totalHeight, 2)}</strong></div>
          </div>
          <p className="hint" style={{ marginTop: -8, marginBottom: 14 }}>
            Trim and page count come from this book. The spine follows them automatically.
          </p>

          <div className="section">
            <div className="section-title">Paper &amp; binding</div>
            <select value={paper} onChange={(e) => setPaper(e.target.value as PaperType)}>
              {OFFERED_PAPER.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {s.note}
                </option>
              ))}
            </select>
            <div className="opt-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
              {(['paperback', 'hardcover'] as BindingType[]).map((b) => (
                <button
                  key={b}
                  className={`opt ${binding === b ? 'active' : ''}`}
                  onClick={() => setBinding(b)}
                >
                  <div className="t">{b === 'paperback' ? 'Paperback' : 'Hardcover'}</div>
                  <div className="s">{b === 'hardcover' ? '+ wrap & hinge' : 'Standard'}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title">Options</div>
            <div className="row between" style={{ marginTop: 6 }}>
              <span className="label" style={{ margin: 0 }}>Background colour</span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: 54 }} />
            </div>
          </div>

          {spec.warnings.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              {spec.warnings.map((w, i) => (
                <div key={i} className="preflight warn">
                  <strong>Check</strong>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {existingCover && (
            <div className="preflight warn" style={{ marginTop: 10 }}>
              <strong>Heads up</strong>
              <span>
                This project already has a cover. Creating one replaces it — a book
                has exactly one.
              </span>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={create} disabled={busy}>
            {busy ? 'Building…' : existingCover ? 'Replace cover' : 'Create a KDP cover'}
          </button>
        </div>
      </div>
    </div>
  );
}
