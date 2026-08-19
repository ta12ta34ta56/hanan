import {
  DESTINATION_OPTIONS,
  type PuzzleDestination,
} from './destination';

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
    hint,
  } = props;

  return (
    <div className="section" style={{ marginBottom: 0 }}>
      <div className="section-title">Where pages go</div>
      <div className="opt-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {DESTINATION_OPTIONS.map((opt) => (
          <button
            key={opt.v}
            className={`opt ${destination === opt.v ? 'active' : ''}`}
            onClick={() => onDestination(opt.v)}
            disabled={busy}
            title={opt.hint}
          >
            <div className="t">{opt.label}</div>
          </button>
        ))}
      </div>
      <label className="toggle-row" style={{ marginTop: 8 }}>
        <span>Replace</span>
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => onReplace(e.target.checked)}
          disabled={busy}
        />
      </label>
      <p className="hint" style={{ margin: '6px 0 10px' }}>
        {DESTINATION_OPTIONS.find((o) => o.v === destination)?.hint}.
        {replace
          ? ' Replace overwrites the destination.'
          : ' Off = stack on top of what is already there.'}
      </p>
      <button
        className="btn primary"
        style={{ width: '100%', justifyContent: 'center', position: 'sticky', bottom: 0, zIndex: 2 }}
        onClick={onGenerate}
        disabled={busy || disabled}
      >
        {busy ? 'Generating…' : label}
      </button>
      <p className="hint" style={{ marginTop: 8 }}>
        About <strong>{estPages}</strong> page{estPages === 1 ? '' : 's'}.
        Extra interiors are added automatically if the book is too short.
        {hint ? ` ${hint}` : ''}
      </p>
    </div>
  );
}
