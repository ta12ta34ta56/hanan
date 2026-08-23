import type { ReactNode } from 'react';
import {
  DESTINATION_OPTIONS,
  type PuzzleDestination,
} from './destination';

const SHORT: Record<PuzzleDestination, string> = {
  all: 'All',
  blank: 'Blank',
  append: 'Append',
};

/** First-open extras. Looks like a control, not a heading. */
export function GenMore({ children }: { children: ReactNode }) {
  return (
    <details className="gen-more">
      <summary>More</summary>
      <div className="gen-more-body">{children}</div>
    </details>
  );
}

/** Nested drawer — themes, directions, anything that dumps a wall of chips. */
export function GenDrawer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="gen-more gen-drawer">
      <summary>{label}</summary>
      <div className="gen-more-body">{children}</div>
    </details>
  );
}

export function DestRow(props: {
  destination: PuzzleDestination;
  onDestination: (v: PuzzleDestination) => void;
  replace: boolean;
  onReplace: (v: boolean) => void;
  busy: boolean;
}) {
  const { destination, onDestination, replace, onReplace, busy } = props;
  return (
    <>
      <div className="set-row">
        <span>Pages</span>
        <div className="chips">
          {DESTINATION_OPTIONS.map((opt) => (
            <button
              key={opt.v}
              type="button"
              className={`chip ${destination === opt.v ? 'active' : ''}`}
              onClick={() => onDestination(opt.v)}
              disabled={busy}
              title={opt.hint}
            >
              {SHORT[opt.v]}
            </button>
          ))}
        </div>
      </div>
      <label className="toggle-row">
        <span>Replace</span>
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => onReplace(e.target.checked)}
          disabled={busy}
        />
      </label>
    </>
  );
}

export function GenerateBar(props: {
  onGenerate: () => void;
  busy: boolean;
  disabled?: boolean;
  label?: string;
  estPages: number;
}) {
  const { onGenerate, busy, disabled, label = 'Generate', estPages } = props;

  return (
    <div className="gen-go">
      <button
        className="btn primary"
        type="button"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={onGenerate}
        disabled={busy || disabled}
      >
        {busy ? 'Generating…' : label}
      </button>
      <p className="set-meta">
        {estPages} page{estPages === 1 ? '' : 's'}
      </p>
    </div>
  );
}
