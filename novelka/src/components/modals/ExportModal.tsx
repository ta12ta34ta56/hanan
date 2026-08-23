import { useMemo, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorUiStore } from '../../stores/editor-ui-store';
import { useToastStore } from '../../stores/toast-store';
import { runComprehensivePreflight } from '../../domain/preflight';
import { bookDiagnostics, withBookDiagnostics } from '../../services/book';
import { downloadBlob, exportPDF } from '../../engine/pdf-export';

type What = 'interior' | 'cover' | 'both';

function pdfBaseName(projectName: string) {
  const s = projectName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
  return s || 'book';
}

export function ExportModal({
  onClose,
  onExported,
}: {
  onClose: () => void;
  onExported?: () => void;
}) {
  const { pages, projectName, serialize } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const [what, setWhat] = useState<What>('interior');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [error, setError] = useState('');

  const hasCover = pages.some((p) => p.role === 'cover');
  const interiorCount = pages.filter((p) => p.role !== 'cover').length;

  const book = useCanvasStore((s) => s.book);
  const preflightResult = useMemo(() => {
    const preset = what === 'cover' ? 'cover' : 'interior';
    return withBookDiagnostics(
      runComprehensivePreflight(pages, { exportPreset: preset, dpi: 300 }),
      bookDiagnostics(pages, book),
    );
  }, [pages, what, book]);

  const writePdf = async (
    target: typeof pages,
    filename: string,
    label: string,
  ) => {
    setStatus('busy', label);
    const blob = await exportPDF(target, projectName, {
      dpi: 300,
      mode: 'hybrid',
      onProgress: (done, total, step) => setProgress({ done, total, label: step }),
    });
    downloadBlob(blob, filename);
  };

  const run = async () => {
    if (preflightResult.status === 'blocked') {
      setError(preflightResult.summary);
      setStatus('error', preflightResult.summary);
      return;
    }
    if (what === 'cover' && !hasCover) {
      setError('This book has no cover.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const file = serialize();
      const base = pdfBaseName(projectName);
      const interiors = file.pages.filter((p) => p.role !== 'cover');
      const covers = file.pages.filter((p) => p.role === 'cover');

      if (what === 'interior' || what === 'both') {
        await writePdf(interiors, `${base}-interior.pdf`, 'Downloading interior…');
      }
      if ((what === 'cover' || what === 'both') && covers.length) {
        if (what === 'both') await new Promise((r) => setTimeout(r, 400));
        await writePdf(covers, `${base}-cover.pdf`, 'Downloading cover…');
      }

      setStatus('success', what === 'both' ? 'Two PDF files downloaded' : 'PDF downloaded');
      onClose();
      onExported?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      setError(msg);
      setStatus('error', msg);
    } finally {
      setBusy(false);
    }
  };

  const base = pdfBaseName(projectName);
  const fileHint =
    what === 'both'
      ? `${base}-interior.pdf + ${base}-cover.pdf`
      : what === 'cover'
        ? `${base}-cover.pdf`
        : `${base}-interior.pdf`;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal ink-modal">
        <div className="modal-head">
          <span>Export</span>
          <button className="btn icon ghost" type="button" onClick={onClose} disabled={busy} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="chips">
            <button type="button" className={`chip ${what === 'interior' ? 'active' : ''}`} onClick={() => setWhat('interior')}>
              Interior
            </button>
            {hasCover && (
              <button type="button" className={`chip ${what === 'cover' ? 'active' : ''}`} onClick={() => setWhat('cover')}>
                Cover
              </button>
            )}
            {hasCover && (
              <button type="button" className={`chip ${what === 'both' ? 'active' : ''}`} onClick={() => setWhat('both')}>
                Both
              </button>
            )}
          </div>
          <p className="set-meta">{fileHint} · PDF only</p>
          {what === 'interior' && <p className="set-meta">{interiorCount} interior page{interiorCount === 1 ? '' : 's'}</p>}

          {preflightResult.status === 'warnings' && (
            <p className="set-meta">{preflightResult.warnings.length} warning{preflightResult.warnings.length === 1 ? '' : 's'} — still downloads.</p>
          )}
          {preflightResult.status === 'blocked' && (
            <p className="set-meta" style={{ color: '#fca5a5' }}>
              {preflightResult.errors.length} blocking issue{preflightResult.errors.length === 1 ? '' : 's'}.{' '}
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  useEditorUiStore.getState().setRightDock('kdp');
                  onClose();
                }}
              >
                KDP check
              </button>
            </p>
          )}

          {busy && (
            <>
              <div className="progress">
                <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 15}%` }} />
              </div>
              <p className="set-meta">{progress.label || 'Working…'}</p>
            </>
          )}

          {error && <p className="set-meta" style={{ color: '#fca5a5' }}>{error}</p>}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className="btn primary"
            type="button"
            onClick={() => void run()}
            disabled={busy || preflightResult.status === 'blocked'}
          >
            {busy ? 'Downloading…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
