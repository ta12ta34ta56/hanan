interface Props {
  onCreateBook: () => void;
  onQuickPuzzle: () => void;
}

export function HomeScreen({ onCreateBook, onQuickPuzzle }: Props) {
  return (
    <div className="lp-scroll">
      <div className="home-gate">
        <span className="lp-eyebrow">
          <span className="lp-dot" />
          Low-content books
        </span>
        <h1 className="home-gate-title">Novelka</h1>
        <p className="home-gate-sub">
          Click, and a print-ready book is made. Rules stay inside the app.
        </p>
        <div className="home-gate-actions">
          <button className="lp-btn lp-btn-primary" onClick={onCreateBook}>
            Create a book
          </button>
          <button className="lp-btn lp-btn-ghost" onClick={onQuickPuzzle}>
            Quick puzzle making
          </button>
        </div>
      </div>
    </div>
  );
}
