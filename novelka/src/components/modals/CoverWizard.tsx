import { useMemo, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { loadFont } from '../../engine/font-manager';
import {
  calculateCover,
  coverZones,
  formatIn,
  type BindingType,
  type PaperType,
} from '../../services/kdp-cover';
import { buildCoverObjects } from '../../services/book';
import { IN } from '../../types/canvas.types';

/**
 * Cover creation — trim and page count come from the book. Paper is white
 * or cream. Binding is paperback / hardcover. No trim picker. No page slider.
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

  const dW = 220;
  const k = dW / spec.totalWidth;
  const trimLabel = `${(book.trimWidth / IN).toFixed(book.trimWidth % IN ? 2 : 0)} × ${(book.trimHeight / IN).toFixed(book.trimHeight % IN ? 2 : 0)}`;
  const hardWarns = spec.warnings.filter((w) => !w.startsWith('Spine text'));

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal ink-modal">
        <div className="modal-head">
          <span>Cover creation</span>
          <button className="btn icon ghost" onClick={onClose} disabled={busy} aria-label="Close">✕</button>
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

          <p className="set-meta">
            {trimLabel} in · {interiorCount} pages · spine {formatIn(spec.spine)}
          </p>

          <div className="set-row">
            <span>Paper</span>
            <div className="chips">
              <button type="button" className={`chip ${paper === 'white' ? 'active' : ''}`} onClick={() => setPaper('white')}>White</button>
              <button type="button" className={`chip ${paper === 'cream' ? 'active' : ''}`} onClick={() => setPaper('cream')}>Cream</button>
            </div>
          </div>
          <div className="set-row">
            <span>Bind</span>
            <div className="chips">
              <button type="button" className={`chip ${binding === 'paperback' ? 'active' : ''}`} onClick={() => setBinding('paperback')}>Paperback</button>
              <button type="button" className={`chip ${binding === 'hardcover' ? 'active' : ''}`} onClick={() => setBinding('hardcover')}>Hardcover</button>
            </div>
          </div>
          <label className="set-row">
            <span>Colour</span>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} aria-label="Cover background" />
          </label>

          {hardWarns.map((w) => (
            <p key={w} className="newbook-guidance warn">{w}</p>
          ))}
          {existingCover && (
            <p className="set-meta">This replaces the cover you already have.</p>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={() => void create()} disabled={busy}>
            {busy ? 'Building…' : existingCover ? 'Replace cover' : 'Create a KDP cover'}
          </button>
        </div>
      </div>
    </div>
  );
}
