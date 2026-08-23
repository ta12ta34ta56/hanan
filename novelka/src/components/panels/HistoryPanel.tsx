import { useCanvasStore } from '../../stores/canvas-store';

export function HistoryPanel() {
  const { past, future, jumpToHistory, jumpToFuture, undo, redo } = useCanvasStore();

  return (
    <div className="panel-body">
      <div className="chips" style={{ marginBottom: 6 }}>
        <button type="button" className="chip" disabled={past.length < 2} onClick={undo}>
          Undo
        </button>
        <button type="button" className="chip" disabled={!future.length} onClick={redo}>
          Redo
        </button>
      </div>

      <div className="stack" style={{ gap: 1 }}>
        {[...past].reverse().map((h, ri) => {
          const i = past.length - 1 - ri;
          return (
            <button
              key={`${h.at}-${i}`}
              type="button"
              className={`history-item ${i === past.length - 1 ? 'current' : ''}`}
              onClick={() => void jumpToHistory(i)}
            >
              <span style={{ flex: 1, textAlign: 'left' }}>{h.label}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>
                {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          );
        })}
        {future.map((h, i) => (
          <button
            key={`f-${h.at}-${i}`}
            type="button"
            className="history-item future"
            onClick={() => void jumpToFuture(i)}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>{h.label}</span>
          </button>
        ))}
      </div>

      {past.length === 0 && <div className="empty">No history yet.</div>}
    </div>
  );
}
