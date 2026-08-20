import {
  DESTINATION_OPTIONS,
  type PuzzleDestination,
} from './destination';

const SHORT: Record<PuzzleDestination, string> = {
  all: 'All',
  blank: 'Blank',
  append: 'Append',
};

export function GenerateBar(props: {
  destination: PuzzleDestination;
  onDestination: (v: PuzzleDestination) => void;
  replace: boolean;
  onReplace: (v: boolean) => void;
  onGenerate: () => void;
  busy: boolean;
  disabled?: boolean;
  label?: string;
  estPages: number;
  hint?: string;
}) {
  const {
    destination,
    onDestination,
    replace,
    onReplace,
    onGenerate,
    busy,
    disabled,
    label = 'Generate',
    estPages,
  } = props;

  return (
    <div className="gen-go">
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
      <label className="toggle-row">
        <span>Replace</span>
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => onReplace(e.target.checked)}
          disabled={busy}
        />
      </label>
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
