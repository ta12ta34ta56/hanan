import { useEffect, useState } from 'react';
import { storage, type StoredProject } from '../../services/storage';
import { Icon } from '../Icon';

interface Props {
  onOpenProject: (p: StoredProject) => void;
  onPreviewProject: (p: StoredProject) => void;
  onExportProject: (p: StoredProject) => void;
  onCreateBook: () => void;
}

export function ProjectsView({
  onOpenProject,
  onPreviewProject,
  onExportProject,
  onCreateBook,
}: Props) {
  const [projects, setProjects] = useState<StoredProject[]>(() => storage.listCached() as StoredProject[]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refresh = async () => {
    const all = await storage.list();
    setProjects(all);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Delete project "${name}"? This cannot be undone.`,
      )
    ) {
      try {
        await storage.remove(id);
        await refresh();
      } catch {
        setErrorMsg(`Failed to delete project "${name}".`);
      }
    }
  };

  const handleStartRename = (p: StoredProject) => {
    setRenamingId(p.id);
    setRenameValue(p.name);
    setErrorMsg('');
  };

  const handleSaveRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setErrorMsg('Project name cannot be empty.');
      return;
    }
    try {
      await storage.rename(id, trimmed);
      setRenamingId(null);
      await refresh();
    } catch {
      setErrorMsg('Failed to rename project.');
    }
  };

  const handleDuplicate = async (p: StoredProject) => {
    try {
      setErrorMsg('');
      await storage.duplicate(p.id);
      await refresh();
    } catch {
      setErrorMsg(`Failed to duplicate project "${p.name}".`);
    }
  };

  return (
    <div className="lp-scroll" style={{ padding: '32px 24px 64px 24px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <span className="lp-eyebrow" style={{ marginBottom: 6 }}>
            <span className="lp-dot" />
            Project Management
          </span>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Saved Projects {projects.length > 0 && `(${projects.length})`}
          </h2>
          <p className="hint" style={{ fontSize: 14, margin: 0 }}>
            Your books on this device. Open one to keep working, or download PDFs from Export.
          </p>
        </div>

        <button className="lp-btn lp-btn-primary lp-btn-sm" onClick={onCreateBook}>
          <Icon name="plus" size={14} /> Create a book
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', borderRadius: 8, marginBottom: 18, fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      {projects.length === 0 && !loading ? (
        <div
          style={{
            background: 'var(--lp-card, #1e293b)',
            border: '1px dashed var(--lp-line, #334155)',
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: 520,
            margin: '40px auto',
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--lp-bg-2, #0f172a)', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
            <Icon name="folder" size={24} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No Saved Projects Yet</h3>
          <p style={{ color: 'var(--lp-dim, #94a3b8)', fontSize: 13.5, margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Create a book and it will show up here.
          </p>
          <button className="lp-btn lp-btn-primary" onClick={onCreateBook}>
            Create a book
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 18 }}>
          {projects.map((p) => {
            const interiors = (p.file?.pages ?? []).filter((page) => page.role !== 'cover').length;

            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--lp-card, #1e293b)',
                  border: '1px solid var(--lp-line, #334155)',
                  borderRadius: 14,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                    <div
                      style={{
                        width: 52,
                        height: 66,
                        borderRadius: 8,
                        background: 'var(--lp-bg-2, #0f172a)',
                        border: '1px solid var(--lp-line, #334155)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icon name="book" size={22} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renamingId === p.id ? (
                        <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleSaveRename(p.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            autoFocus
                            style={{ padding: '3px 8px', fontSize: 13, flex: 1 }}
                          />
                          <button className="btn sm primary" onClick={() => handleSaveRename(p.id)}>
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3
                            style={{
                              margin: '0 0 2px 0',
                              fontSize: 15,
                              fontWeight: 700,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'var(--lp-text, #f8fafc)',
                            }}
                            title={p.name}
                          >
                            {p.name}
                          </h3>
                          <button
                            className="btn icon sm ghost"
                            onClick={() => handleStartRename(p)}
                            title="Rename project"
                            aria-label="Rename project"
                            style={{ padding: 2, height: 22, width: 22 }}
                          >
                            <Icon name="type" size={12} />
                          </button>
                        </div>
                      )}

                      <div className="hint" style={{ fontSize: 12 }}>
                        {interiors} interior page{interiors === 1 ? '' : 's'}
                      </div>
                      <div className="hint" style={{ fontSize: 11, marginTop: 6 }}>
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="stack" style={{ gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <button
                      className="lp-btn lp-btn-primary lp-btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => onOpenProject(p)}
                    >
                      <Icon name="sidebar" size={13} /> Edit
                    </button>

                    <button
                      className="lp-btn lp-btn-ghost lp-btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => onPreviewProject(p)}
                    >
                      <Icon name="eye" size={13} /> Preview
                    </button>

                    <button
                      className="lp-btn lp-btn-ghost lp-btn-sm"
                      onClick={() => onExportProject(p)}
                      title="Download PDF"
                      aria-label="Download PDF"
                    >
                      <Icon name="download" size={13} /> Export
                    </button>
                  </div>

                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--lp-line, #334155)', paddingTop: 8 }}>
                    <button
                      className="btn sm ghost"
                      style={{ fontSize: 11.5, padding: '2px 6px' }}
                      onClick={() => handleDuplicate(p)}
                      title="Duplicate project"
                    >
                      <Icon name="clone" size={12} /> Duplicate
                    </button>

                    <button
                      className="btn sm ghost danger"
                      style={{ fontSize: 11.5, padding: '2px 6px' }}
                      onClick={() => handleDelete(p.id, p.name)}
                      title="Delete project"
                    >
                      <Icon name="trash" size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
