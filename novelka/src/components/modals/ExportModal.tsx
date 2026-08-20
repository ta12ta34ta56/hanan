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

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <span>Download PDF</span>
          <button className="btn icon ghost" onClick={onClose} disabled={busy} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="section">
            <div className="section-title">What to download</div>
            <div className="opt-grid" style={{ gridTemplateColumns: hasCover ? '1fr 1fr 1fr' : '1fr' }}>
              <button
                className={`opt ${what === 'interior' ? 'active' : ''}`}
                onClick={() => setWhat('interior')}
              >
                <div className="t">Interior</div>
                <div className="s">{interiorCount} page{interiorCount === 1 ? '' : 's'} · PDF</div>
              </button>
              {hasCover && (
                <button
                  className={`opt ${what === 'cover' ? 'active' : ''}`}
                  onClick={() => setWhat('cover')}
                >
                  <div className="t">Cover</div>
                  <div className="s">Wraparound · PDF</div>
                </button>
              )}
              {hasCover && (
                <button
                  className={`opt ${what === 'both' ? 'active' : ''}`}
                  onClick={() => setWhat('both')}
                >
                  <div className="t">Both</div>
                  <div className="s">Two separate PDFs</div>
                </button>
              )}
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              {what === 'both'
                ? `Two files: ${pdfBaseName(projectName)}-interior.pdf and ${pdfBaseName(projectName)}-cover.pdf. Not combined.`
                : what === 'cover'
                  ? `File: ${pdfBaseName(projectName)}-cover.pdf`
                  : `File: ${pdfBaseName(projectName)}-interior.pdf`}
            </p>
          </div>

          <div className="section">
            <div className="section-title">Preflight</div>
            {preflightResult.status === 'pass' && (
              <div className="preflight ok">
                <strong>✓ Preflight passed</strong>
              </div>
            )}
            {preflightResult.status === 'warnings' && (
              <div className="preflight warn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>
                  <strong>⚠ {preflightResult.warnings.length} warning{preflightResult.warnings.length === 1 ? '' : 's'}</strong>
                </span>
                <button
                  className="btn sm"
                  style={{ flex: 'none' }}
                  onClick={() => {
                    useEditorUiStore.getState().setRightDock('kdp');
                    onClose();
                  }}
                >
                  Open KDP Check
                </button>
              </div>
            )}
            {preflightResult.status === 'blocked' && (
              <div className="preflight error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>
                  <strong>⛔ {preflightResult.errors.length} blocking error{preflightResult.errors.length === 1 ? '' : 's'}</strong>
                </span>
                <button
                  className="btn sm"
                  style={{ flex: 'none' }}
                  onClick={() => {
                    useEditorUiStore.getState().setRightDock('kdp');
                    onClose();
                  }}
                >
                  Open KDP Check
                </button>
              </div>
            )}
          </div>

          {busy && (
            <div className="section">
              <div className="progress">
                <div style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 15}%` }} />
              </div>
              <p className="hint" style={{ marginTop: 6 }}>{progress.label || 'Working…'}</p>
            </div>
          )}

          {error && (
            <p className="hint" style={{ color: 'var(--bad)' }}>
              {error}
            </p>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => void run()}
            disabled={busy || preflightResult.status === 'blocked'}
          >
            {busy ? 'Downloading…' : preflightResult.status === 'blocked' ? 'Export blocked' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
