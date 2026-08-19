interface Props {
  onCreateBook: () => void;
  onQuickPuzzle: () => void;
  onProjects: () => void;
}

export function HomeScreen({ onCreateBook, onQuickPuzzle, onProjects }: Props) {
  return (
    <div className="lp-scroll">
      <div className="home-gate">
        <div className="home-gate-actions">
          <button className="lp-btn lp-btn-primary" onClick={onCreateBook}>
            Create a book
          </button>
          <button className="lp-btn lp-btn-ghost" onClick={onQuickPuzzle}>
            Quick puzzle making
          </button>
          <button className="lp-btn lp-btn-ghost" onClick={onProjects}>
            Projects
          </button>
        </div>
      </div>
    </div>
  );
}
