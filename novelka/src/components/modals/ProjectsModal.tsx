import { useEffect, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import {
  StorageFullError,
  downloadJSON,
  readProjectFile,
  storage,
  type StoredProject,
} from '../../services/storage';
import { liveThumbnail } from '../../engine/live-thumbnail';

export function ProjectsModal({
  onClose,
  projectId,
  setProjectId,
}: {
  onClose: () => void;
  projectId: string;
  setProjectId: (id: string) => void;
}) {
  const { serialize, loadProject, newProject, projectName } = useCanvasStore();
  const setStatus = useToastStore((s) => s.setStatus);
  const [list, setList] = useState<StoredProject[]>([]);
  const [error, setError] = useState('');

  const refresh = () => { void storage.list().then(setList); };
  useEffect(refresh, []);

  const saveNow = async () => {
    setError('');
    try {
      await storage.save(projectId, serialize(), liveThumbnail() ?? undefined);
      refresh();
      setStatus('success', `“${projectName}” saved`);
    } catch (e) {
      setError(
        e instanceof StorageFullError
          ? 'Not enough space — delete an old one, or download a copy.'
          : 'Could not save. Download a copy so this is not lost.',
      );
    }
  };

  const open = async (p: StoredProject) => {
    await loadProject(p.file);
    setProjectId(p.id);
    onClose();
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = await readProjectFile(file);
      await loadProject(parsed);
      setProjectId(crypto.randomUUID());
      onClose();
    } catch {
      setError('That file is not a Novelka project.');
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal ink-modal">
        <div className="modal-head">
          <span>Projects</span>
          <button className="btn icon ghost" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="chips" style={{ marginBottom: 4 }}>
            <button type="button" className="chip active" onClick={() => void saveNow()}>Save</button>
            <button type="button" className="chip" onClick={() => downloadJSON(serialize())}>Download</button>
            <label className="chip" style={{ cursor: 'pointer' }}>
              Import
              <input type="file" accept=".json" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
            </label>
            <button
              type="button"
              className="chip"
              onClick={() => void (async () => {
                await newProject();
                setProjectId(crypto.randomUUID());
                onClose();
              })()}
            >
              New
            </button>
          </div>

          {error && <p className="set-meta" style={{ color: '#fca5a5' }}>{error}</p>}

          {list.length === 0 ? (
            <div className="empty">Nothing saved yet.</div>
          ) : (
            <div className="stack" style={{ gap: 4 }}>
              {list.map((p) => (
                <div key={p.id} className={`ink-project${p.id === projectId ? ' on' : ''}`}>
                  <div className="ink-project-thumb">
                    {p.thumbnail && <img src={p.thumbnail} alt="" />}
                  </div>
                  <div className="ink-project-meta">
                    <strong>{p.name}</strong>
                    <span>{p.pageCount}p · {new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <button type="button" className="chip" onClick={() => void open(p)}>Open</button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => void (async () => {
                      await storage.remove(p.id);
                      refresh();
                    })()}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
