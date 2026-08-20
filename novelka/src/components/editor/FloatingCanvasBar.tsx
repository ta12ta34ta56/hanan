import { useEffect, useState } from 'react';
import { engine } from '../../engine/canvas-engine';
import { useSelection } from '../../hooks/useSelection';
import { Icon } from '../Icon';
import {
  nudgeSelectionFontSize,
  setSelectionFontSize,
  setSelectionStrokeWidth,
  setSelectionTextAlign,
  toggleSelectionTextProp,
} from '../../services/selection-actions';
import { useCanvasStore } from '../../stores/canvas-store';
import { resolveInstanceForObject, selectSemanticInstance } from '../../domain';
import type { InspectorView } from './InspectorPanel';

export function FloatingCanvasBar({
  onToggleInspector,
}: {
  onToggleInspector: (next: InspectorView) => void;
}) {
  const selection = useSelection();
  const activePage = useCanvasStore((s) => s.activePage());
  const [sizeDraft, setSizeDraft] = useState('');
  const [strokeDraft, setStrokeDraft] = useState('');
  const [radiusDraft, setRadiusDraft] = useState('');

  const primary = selection.primary;
  const instance = resolveInstanceForObject(primary, activePage);
  const primaryAny = primary as {
    tintColor?: string;
    fill?: unknown;
    stroke?: unknown;
    strokeWidth?: number;
    lastStrokeColor?: string;
    rx?: number;
    type?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: unknown;
    fontStyle?: unknown;
    underline?: boolean;
    textAlign?: string;
    elementType?: string;
    name?: string;
    recolorable?: boolean;
  } | null;

  useEffect(() => {
    if (!selection.isText) return setSizeDraft('');
    setSizeDraft(String(Math.round(primaryAny?.fontSize ?? 16)));
  }, [selection.isText, selection.version, primaryAny?.fontSize]);

  useEffect(() => {
    if (!primaryAny || selection.isText) return setStrokeDraft('');
    setStrokeDraft(String(Number(primaryAny.strokeWidth ?? 0)));
  }, [selection.isText, selection.version, primaryAny?.strokeWidth, primaryAny]);

  useEffect(() => {
    if (primaryAny?.type !== 'rect') return setRadiusDraft('');
    setRadiusDraft(String(Math.round(Number(primaryAny.rx ?? 0))));
  }, [selection.version, primaryAny?.rx, primaryAny?.type]);

  // Nothing is selected, so the page/canvas itself is the active target. The
  // page actions now live in the vertical page dock (rendered by CanvasStage).
  if (selection.count === 0) return null;

  const open = (next: InspectorView) => onToggleInspector(next);
  const fontFamily = String(primaryAny?.fontFamily ?? 'Inter');
  const textColor = typeof primaryAny?.fill === 'string' ? primaryAny.fill : '#111827';
  const fillColor =
    typeof primaryAny?.tintColor === 'string'
      ? primaryAny.tintColor
      : typeof primaryAny?.fill === 'string'
        ? primaryAny.fill
        : '#111827';
  const strokeColor =
    typeof primaryAny?.stroke === 'string' && primaryAny.stroke !== 'transparent' && primaryAny.stroke !== 'none'
      ? primaryAny.stroke
      : typeof primaryAny?.lastStrokeColor === 'string'
        ? primaryAny.lastStrokeColor
        : '#111827';
  const isRect = primaryAny?.type === 'rect';
  const isGroupLike = selection.isMultiple || selection.isGroup;

  const commitStrokeWidth = () => {
    const n = parseFloat(strokeDraft);
    if (!Number.isNaN(n)) setSelectionStrokeWidth(n);
  };

  const setCornerRadius = (value: number) => {
    const c = engine.canvas;
    if (!c) return;
    c.getActiveObjects().forEach((obj) => {
      if (obj.type !== 'rect') return;
      obj.set({ rx: value, ry: value });
      obj.setCoords();
      obj.dirty = true;
    });
    c.requestRenderAll();
    useCanvasStore.getState().commit('Corner radius');
    engine.notifySelection();
  };

  const commitRadius = () => {
    const n = parseFloat(radiusDraft);
    if (!Number.isNaN(n)) setCornerRadius(Math.max(0, n));
  };

  const alignOrder = ['left', 'center', 'right'] as const;
  const currentAlign = (() => {
    if (primaryAny?.textAlign === 'right') return 'right' as const;
    if (primaryAny?.textAlign === 'center') return 'center' as const;
    return 'left' as const;
  })();
  const nextAlign = alignOrder[(alignOrder.indexOf(currentAlign) + 1) % alignOrder.length];
  const cycleAlign = () => {
    setSelectionTextAlign(nextAlign);
  };

  return (
    <div className="floating-canvas-bar">
      {instance && (
        <>
          <button
            className="canvas-pill"
            onClick={() => open({ kind: 'semanticInstance' })}
            title={`Semantic Instance: ${instance.kind} (Click to open instance inspector)`}
          >
            <Icon name="puzzlePiece" size={13} />
            {instance.role === 'solution' ? 'Solution' : `Puzzle ${instance.source.puzzleIndex || 1}`}
            {instance.overrides?.isOverridden && <span className="canvas-pill-warn">!</span>}
          </button>
          <button
            className="btn icon ghost"
            onClick={() => engine.canvas && selectSemanticInstance(engine.canvas, instance)}
            title="Select all objects in this puzzle instance"
            aria-label="Select all objects in this puzzle instance"
          >
            <Icon name="shapes" size={13} />
          </button>
          <div className="divider" />
        </>
      )}
      {selection.isText ? (
        <>
          <button className="canvas-pill font-pill" onClick={() => open({ kind: 'font' })} title="Font family">
            {fontFamily}
          </button>

          <div className="canvas-stepper">
            <button className="btn icon ghost" onClick={() => nudgeSelectionFontSize(-2)} title="Smaller text" aria-label="Smaller text">
              <Icon name="minus" size={14} />
            </button>
            <input
              value={sizeDraft}
              onChange={(e) => setSizeDraft(e.target.value)}
              onBlur={() => {
                const n = parseFloat(sizeDraft);
                if (!Number.isNaN(n)) setSelectionFontSize(n);
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              aria-label="Font size"
              title="Font size"
            />
            <button className="btn icon ghost" onClick={() => nudgeSelectionFontSize(2)} title="Larger text" aria-label="Larger text">
              <Icon name="plus" size={14} />
            </button>
          </div>

          <button className={`btn icon ghost ${primaryAny?.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => void toggleSelectionTextProp('fontWeight')} title="Bold" aria-label="Bold">
            <Icon name="bold" size={14} />
          </button>
          <button className={`btn icon ghost ${primaryAny?.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => void toggleSelectionTextProp('fontStyle')} title="Italic" aria-label="Italic">
            <Icon name="italic" size={14} />
          </button>
          <button className={`btn icon ghost ${primaryAny?.underline ? 'active' : ''}`} onClick={() => void toggleSelectionTextProp('underline')} title="Underline" aria-label="Underline">
            <Icon name="underline" size={14} />
          </button>

          <button
            className="btn icon ghost toolbar-color-btn"
            onClick={() => open({ kind: 'color', target: 'textFill' })}
            title="Text color"
            aria-label="Text color"
          >
            <Icon name="color" size={15} />
            <span className="toolbar-color-chip" style={{ background: textColor }} />
          </button>
          <button
            className="btn icon ghost"
            onClick={() => open({ kind: 'effects' })}
            title="Text effects (outline, shadow, neon…)"
            aria-label="Text effects"
          >
            <Icon name="wandSparkles" size={14} />
          </button>

          {/* One alignment button that cycles left → center → right. */}
          <button
            className="btn icon ghost"
            onClick={cycleAlign}
            title={`Align ${nextAlign} (click to cycle)`}
            aria-label={`Align ${nextAlign}`}
          >
            <Icon name={currentAlign === 'left' ? 'alignLeft' : currentAlign === 'center' ? 'alignCenterH' : 'alignRight'} size={14} />
          </button>
        </>
      ) : isGroupLike ? (
        <>
          <span className="canvas-bar-title">
            {selection.isGroup ? 'Group' : `${selection.count} objects`}
          </span>
          <button
            className="btn icon ghost toolbar-color-btn"
            onClick={() => open({ kind: 'color', target: 'objectFill' })}
            title="Recolor / fill all"
            aria-label="Recolor / fill all"
          >
            <Icon name="color" size={15} />
            <span className="toolbar-color-chip" style={{ background: fillColor }} />
          </button>
          {selection.isMultiple && (
            <>
              <button className="btn icon ghost" onClick={() => engine.distribute('h')} title="Distribute horizontally" aria-label="Distribute horizontally"><Icon name="distH" size={14} /></button>
              <button className="btn icon ghost" onClick={() => engine.distribute('v')} title="Distribute vertically" aria-label="Distribute vertically"><Icon name="distV" size={14} /></button>
            </>
          )}
          <button className="btn icon ghost" onClick={() => (selection.isGroup ? engine.ungroup() : engine.group())} title={selection.isGroup ? 'Ungroup' : 'Group'} aria-label={selection.isGroup ? 'Ungroup' : 'Group'}>
            <Icon name={selection.isGroup ? 'ungroup' : 'group'} size={14} />
          </button>
        </>
      ) : (
        <>
          <span className="canvas-bar-title">
            {primaryAny?.name ?? primaryAny?.elementType ?? primaryAny?.type ?? 'Selection'}
          </span>
          <button
            className="btn icon ghost toolbar-color-btn"
            onClick={() => open({ kind: 'color', target: 'objectFill' })}
            title={primaryAny?.recolorable || selection.isImage ? 'Recolor asset' : 'Fill color'}
            aria-label={primaryAny?.recolorable || selection.isImage ? 'Recolor asset' : 'Fill color'}
          >
            <Icon name="color" size={15} />
            <span className="toolbar-color-chip" style={{ background: fillColor }} />
          </button>
          {!primaryAny?.recolorable && !selection.isImage && (
            <>
              <button
                className="btn icon ghost toolbar-color-btn"
                onClick={() => open({ kind: 'color', target: 'objectStroke' })}
                title="Stroke color"
                aria-label="Stroke color"
              >
                <Icon name="position" size={15} />
                <span className="toolbar-color-chip" style={{ background: strokeColor }} />
              </button>
              <div className="canvas-stepper">
                <input
                  value={strokeDraft}
                  onChange={(e) => setStrokeDraft(e.target.value)}
                  onBlur={commitStrokeWidth}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  aria-label="Stroke width"
                  title="Stroke width"
                />
              </div>
              {isRect && (
                <div className="canvas-stepper">
                  <input
                    value={radiusDraft}
                    onChange={(e) => setRadiusDraft(e.target.value)}
                    onBlur={commitRadius}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    aria-label="Corner radius"
                    title="Corner radius"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
