import { useRef, useState } from 'react';
import { useCanvasStore } from '../../stores/canvas-store';
import { useEditorUiStore } from '../../stores/editor-ui-store';
import { Icon, type IconName } from '../Icon';

/**
 * Bottom quick-action bar — icons only (tooltips on hover). No visible labels.
 * All toggle logic is the existing editor-ui-store state; zoom is buttons-only.
 * The bar is inset with `--strip-right` so it never overlaps the right panel.
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
    showMargins,
    toggleMargins,
    showCoverGuides,
    toggleCoverGuides,
    setRightDock,
    rightDock,
  } = useEditorUiStore();

  const [editingJump, setEditingJump] = useState(false);
  const [jumpDraft, setJumpDraft] = useState('');
  const jumpRef = useRef<HTMLInputElement>(null);
  const activeIndex = Math.max(0, pages.findIndex((p) => p.id === activePageId));
  const page = pages[activeIndex] ?? pages[0];
  const currentN = activeIndex + 1;
  const totalN = Math.max(1, pages.length);

  const goToNumber = () => {
    const n = parseInt(jumpDraft, 10);
    const clamped = Number.isNaN(n) ? currentN : Math.max(1, Math.min(totalN, n));
    const target = pages[clamped - 1];
    if (target) void gotoPage(target.id);
    setEditingJump(false);
  };

  const openJump = () => {
    setJumpDraft(String(currentN));
    setEditingJump(true);
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
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={on}
    >
      <Icon name={name} size={15} />
    </button>
  );

  return (
    <footer className="editor-footer qbar">
      <div className="qbar-group">
        {iconBtn('shield', showKdpGuides, toggleKdpGuides, 'KDP safe area & gutter guides')}
        {iconBtn('layoutTemplate', showMargins, toggleMargins, 'Show margin & gutter guides')}
        {iconBtn('crop', showBleed, toggleBleed, 'Show 0.125in bleed zone')}
        {iconBtn('bookOpen', showCoverGuides, toggleCoverGuides, 'Show cover bleed reference line')}
      </div>

      <span className="qbar-divider" />

      <div className="qbar-group">
        {iconBtn('magnet', smartGuides, toggleGuides, 'Smart alignment guides')}
        {iconBtn('position', snapToGrid, toggleSnap, 'Snap to grid')}
        {iconBtn('grid', showGrid, toggleGrid, 'Show grid')}
      </div>

      <span className="qbar-divider" />

      {editingJump ? (
        <input
          ref={jumpRef}
          className="footer-jump"
          type="text"
          inputMode="numeric"
          value={jumpDraft}
          onChange={(e) => setJumpDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToNumber();
            if (e.key === 'Escape') setEditingJump(false);
          }}
          onBlur={goToNumber}
          aria-label="Jump to page number"
          style={{ width: 72 }}
        />
      ) : (
        <button
          className="qbar-page"
          onClick={openJump}
          title="Jump to page"
          aria-label={`Page ${currentN} of ${totalN}`}
        >
          {currentN}/{totalN}
        </button>
      )}

      <span className="spacer" />

      <div className="qbar-group qbar-zoom">
        <button
          className="qbar-toggle"
          onClick={() => setZoom(zoom - 0.1)}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Icon name="minus" size={15} />
        </button>
        <button
          className="qbar-toggle"
          onClick={() => setZoom(zoom + 0.1)}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Icon name="plus" size={15} />
        </button>
        <button
          className="qbar-toggle"
          onClick={() => zoomToFit(page.width, page.height)}
          title="Fit page in view"
          aria-label="Fit page in view"
        >
          <Icon name="fit" size={15} />
        </button>
      </div>

      <span className="qbar-divider" />

      <button
        className={`qbar-toggle ${rightDock === 'kdp' ? 'active' : ''}`}
        onClick={() => setRightDock(rightDock === 'kdp' ? null : 'kdp')}
        title="Run KDP preflight checks"
        aria-label="Run KDP preflight checks"
      >
        <Icon name="shield" size={15} />
      </button>
    </footer>
  );
}
