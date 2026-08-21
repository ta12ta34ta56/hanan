import { useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorUiStore } from '../../stores/editor-ui-store';
import { Icon } from '../Icon';

/**
 * Bottom strip: jump and zoom only. Guides live in Settings.
 * KDP check lives in ⋯.
 */
export function EditorFooter() {
  const { pages, activePageId, gotoPage } = useCanvasStore();
  const { zoom, setZoom, zoomToFit } = useEditorUiStore();

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

  return (
    <footer className="editor-footer qbar">
      {jump === null ? (
        <button
          className="qbar-page"
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
        <button
          className="qbar-toggle"
          type="button"
          onClick={() => setZoom(zoom / 1.15)}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Icon name="minus" size={15} />
        </button>
        <span className="qbar-zoom-pct" aria-live="polite">{pct}%</span>
        <button
          className="qbar-toggle"
          type="button"
          onClick={() => setZoom(zoom * 1.15)}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Icon name="plus" size={15} />
        </button>
        <button
          className="qbar-toggle"
          type="button"
          onClick={() => zoomToFit(page.width, page.height)}
          title="Fit page"
          aria-label="Fit page"
        >
          <Icon name="fit" size={15} />
        </button>
      </div>
    </footer>
  );
}
