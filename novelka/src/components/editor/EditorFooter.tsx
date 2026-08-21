import { useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorUiStore } from '../../stores/editor-ui-store';
import { Icon, type IconName } from '../Icon';

/**
 * Ink bottom strip. Your guides are back — one KDP check, no fake margins.
 */
export function EditorFooter() {
  const { pages, activePageId, gotoPage } = useCanvasStore();
  const {
    zoom,
    setZoom,
    zoomToFit,
    showKdpGuides,
    toggleKdpGuides,
    showBleed,
    toggleBleed,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnap,
    smartGuides,
    toggleGuides,
    showCoverGuides,
    toggleCoverGuides,
    setRightDock,
    rightDock,
  } = useEditorUiStore();

  const [jump, setJump] = useState<string | null>(null);
  const jumpRef = useRef<HTMLInputElement>(null);
  const activeIndex = Math.max(0, pages.findIndex((p) => p.id === activePageId));
  const page = pages[activeIndex] ?? pages[0];
  const interiors = pages.filter((p) => p.role !== 'cover');
  const interiorTotal = Math.max(1, interiors.length);
  const onCover = page.role === 'cover';
  const interiorNo = onCover
    ? 0
    : interiors.findIndex((p) => p.id === page.id) + 1;
  const jumpLabel = onCover ? `Cover · ${interiorTotal}` : `${interiorNo}/${interiorTotal}`;
  const pct = Math.round(zoom * 100);

  const goToNumber = () => {
    if (jump === null) return;
    const raw = parseInt(jump, 10);
    if (!Number.isNaN(raw)) {
      const n = Math.max(1, Math.min(interiorTotal, raw));
      const target = interiors[n - 1];
      if (target) void gotoPage(target.id);
    }
    setJump(null);
  };

  const openJump = () => {
    setJump(onCover ? '1' : String(interiorNo || 1));
    requestAnimationFrame(() => jumpRef.current?.select());
  };

  const iconBtn = (
    name: IconName,
    on: boolean,
    onClick: () => void,
    title: string,
  ) => (
    <button
      className={`qbar-toggle ${on ? 'active' : ''}`}
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={on}
    >
      <Icon name={name} size={14} />
    </button>
  );

  return (
    <footer className="editor-footer qbar">
      <div className="qbar-group">
        {iconBtn('shield', showKdpGuides, toggleKdpGuides, 'KDP safe box')}
        {iconBtn('crop', showBleed, toggleBleed, 'Bleed')}
        {onCover && iconBtn('bookOpen', showCoverGuides, toggleCoverGuides, 'Cover marks')}
      </div>

      <span className="qbar-divider" />

      <div className="qbar-group">
        {iconBtn('magnet', smartGuides, toggleGuides, 'Smart guides')}
        {iconBtn('position', snapToGrid, toggleSnap, 'Snap')}
        {iconBtn('grid', showGrid, toggleGrid, 'Grid')}
      </div>

      <span className="qbar-divider" />

      {jump === null ? (
        <button
          className="qbar-page"
          type="button"
          onClick={openJump}
          title="Jump to page"
          aria-label={`Jump to page. Now ${jumpLabel}`}
        >
          {jumpLabel}
        </button>
      ) : (
        <input
          ref={jumpRef}
          className="footer-jump"
          type="number"
          min={1}
          max={interiorTotal}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToNumber();
            if (e.key === 'Escape') setJump(null);
          }}
          onBlur={goToNumber}
          aria-label="Jump to page number"
        />
      )}

      <span className="spacer" />

      <div className="qbar-group qbar-zoom">
        <button className="qbar-toggle" type="button" onClick={() => setZoom(zoom / 1.15)} title="Zoom out" aria-label="Zoom out">
          <Icon name="minus" size={14} />
        </button>
        <span className="qbar-zoom-pct" aria-live="polite">{pct}%</span>
        <button className="qbar-toggle" type="button" onClick={() => setZoom(zoom * 1.15)} title="Zoom in" aria-label="Zoom in">
          <Icon name="plus" size={14} />
        </button>
        <button className="qbar-toggle" type="button" onClick={() => zoomToFit(page.width, page.height)} title="Fit" aria-label="Fit">
          <Icon name="fit" size={14} />
        </button>
      </div>

      <span className="qbar-divider" />

      <button
        className={`qbar-toggle ${rightDock === 'kdp' ? 'active' : ''}`}
        type="button"
        onClick={() => setRightDock(rightDock === 'kdp' ? 'pages' : 'kdp')}
        title="KDP check"
        aria-label="KDP check"
      >
        <Icon name="check" size={14} />
      </button>
    </footer>
  );
}
