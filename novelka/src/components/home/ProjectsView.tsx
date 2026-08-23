import { useEffect, useState } from 'react';
import { storage, type StoredProject } from '../../services/storage';

interface Props {
  onOpenProject: (p: StoredProject) => void;
  onPreviewProject: (p: StoredProject) => void;
  onExportProject: (p: StoredProject) => void;
  onCreateBook: () => void;
}

function interiorsOf(p: StoredProject): number {
  const pages = p.file?.pages;
  if (!pages) return p.pageCount;
  return pages.filter((page) => page.role !== 'cover').length;
}

export function ProjectsView({
  onOpenProject,
  onPreviewProject,
  onExportProject,
  onCreateBook,
}: Props) {
  const [projects, setProjects] = useState<StoredProject[]>(() => storage.listCached() as StoredProject[]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refresh = async () => {
    setProjects(await storage.list());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    try {
      await storage.remove(id);
      await refresh();
    } catch {
      setErrorMsg(`Could not delete “${name}”.`);
    }
  };

  const handleSaveRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setErrorMsg('Name cannot be empty.');
      return;
    }
    try {
      await storage.rename(id, trimmed);
      setRenamingId(null);
      await refresh();
    } catch {
      setErrorMsg('Could not rename.');
    }
  };

  const handleDuplicate = async (p: StoredProject) => {
    try {
      setErrorMsg('');
      await storage.duplicate(p.id);
      await refresh();
    } catch {
      setErrorMsg(`Could not duplicate “${p.name}”.`);
    }
  };

  return (
    <div className="nk-home nk-books">
      <div className="nk-home-bottom-head">
        <span>Your books</span>
        <button type="button" onClick={onCreateBook}>New</button>
      </div>

      {errorMsg && <p className="nk-home-err">{errorMsg}</p>}

      {projects.length === 0 ? (
        <p className="nk-home-empty">Nothing here yet.</p>
      ) : (
        <div className="nk-book-list">
          {projects.map((p) => {
            const n = interiorsOf(p);
            return (
              <div key={p.id} className="nk-book-row wrap">
                {renamingId === p.id ? (
                  <input
                    className="nk-book-rename"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveRename(p.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    autoFocus
                    aria-label="Project name"
                  />
                ) : (
                  <button
                    type="button"
                    className="nk-book-open"
                    onClick={() => onOpenProject(p)}
                  >
                    <span className="nk-book-thumb">
                      {p.thumbnail ? <img src={p.thumbnail} alt="" /> : null}
                    </span>
                    <span className="nk-book-meta">
                      <strong>{p.name}</strong>
                      <em>
                        {n} page{n === 1 ? '' : 's'} · {new Date(p.updatedAt).toLocaleDateString()}
                      </em>
                    </span>
                  </button>
                )}
                <div className="nk-book-acts">
                  <button type="button" onClick={() => onPreviewProject(p)}>Preview</button>
                  <button type="button" onClick={() => onExportProject(p)}>Export</button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(p.id);
                      setRenameValue(p.name);
                      setErrorMsg('');
                    }}
                  >
                    Rename
                  </button>
                  <button type="button" onClick={() => void handleDuplicate(p)}>Copy</button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void handleDelete(p.id, p.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
