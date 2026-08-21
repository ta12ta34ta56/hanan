import { useEffect } from 'react';

const KEYS: { keys: string; does: string }[] = [
  { keys: 'Ctrl Z', does: 'Undo' },
  { keys: 'Ctrl Y', does: 'Redo' },
  { keys: 'Ctrl C', does: 'Copy' },
  { keys: 'Ctrl X', does: 'Cut' },
  { keys: 'Ctrl V', does: 'Paste' },
  { keys: 'Ctrl D', does: 'Duplicate' },
  { keys: 'Ctrl A', does: 'Select all' },
  { keys: 'Ctrl G', does: 'Group' },
  { keys: 'Ctrl Shift G', does: 'Ungroup' },
  { keys: 'Ctrl E', does: 'Export' },
  { keys: 'Delete', does: 'Delete' },
  { keys: 'Esc', does: 'Deselect' },
  { keys: '← →', does: 'Flip pages' },
  { keys: 'Ctrl + −', does: 'Zoom' },
  { keys: 'Ctrl 0', does: 'Zoom 100%' },
];

export function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="modal ink-modal">
        <div className="modal-head">
          <span id="help-modal-title">Shortcuts</span>
          <button className="btn icon ghost" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="ink-keys">
            {KEYS.map((row) => (
              <div key={row.keys} className="ink-key">
                <span>{row.does}</span>
                <kbd>{row.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
