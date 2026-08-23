import { useEffect, useState } from 'react';
import { storage, type StoredProject } from '../services/storage';

interface Props {
  onCreateBook: () => void;
  onQuickPuzzle: () => void;
  onProjects: () => void;
  onOpenProject: (p: StoredProject) => void;
}

function interiorsOf(p: StoredProject): number {
  const pages = p.file?.pages;
  if (!pages) return p.pageCount;
  return pages.filter((page) => page.role !== 'cover').length;
}

export function HomeScreen({
  onCreateBook,
  onQuickPuzzle,
  onProjects,
  onOpenProject,
}: Props) {
  const [books, setBooks] = useState<StoredProject[]>([]);

  useEffect(() => {
    void storage.list().then(setBooks);
  }, []);

  const recent = books.slice(0, 6);

  return (
    <div className="nk-home">
      <div className="nk-home-go">
        <button type="button" className="nk-home-btn" onClick={onCreateBook}>
          Create a book
        </button>
        <button type="button" className="nk-home-btn quiet" onClick={onQuickPuzzle}>
          Quick puzzle making
        </button>
      </div>

      <div className="nk-home-bottom">
        <div className="nk-home-bottom-head">
          <span>Your books</span>
          {books.length > 0 && (
            <button type="button" onClick={onProjects}>
              All{books.length > 6 ? ` · ${books.length}` : ''}
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="nk-home-empty">Nothing here yet.</p>
        ) : (
          <div className="nk-book-list">
            {recent.map((p) => {
              const n = interiorsOf(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  className="nk-book-row"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
