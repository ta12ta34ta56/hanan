import * as fabric from 'fabric';
import { engine, type FabricAny } from '../../engine/canvas-engine';
import { useCanvasStore } from '../../stores/canvas-store';

/**
 * Temporary canvas preview for puzzles and page templates.
 *
 * Ghost objects are tagged `novelkaGhost` so they never enter page.data,
 * never export, and never undo. A white plate covers the current page so
 * the user sees the preview, not leftover book content.
 */

export const PREVIEW_FLAG = 'novelkaGhost';

type Ghost = FabricAny & { novelkaGhost?: boolean };

function isGhost(o: fabric.FabricObject): boolean {
  return !!(o as Ghost).novelkaGhost;
}

/** Preview and generate never sit on the cover. */
export async function ensureInteriorForPreview(): Promise<boolean> {
  const { pages, activePageId, gotoPage } = useCanvasStore.getState();
  const active = pages.find((p) => p.id === activePageId);
  if (!active || active.role !== 'cover') return true;
  const interior = pages.find((p) => p.role !== 'cover');
  if (!interior) return false;
  await gotoPage(interior.id);
  return true;
}

export function clearPuzzlePreview() {
  const c = engine.canvas;
  if (!c) return;
  const ghosts = c.getObjects().filter(isGhost);
  if (!ghosts.length) return;
  void engine.silent(() => {
    c.discardActiveObject();
    c.remove(...ghosts);
    c.requestRenderAll();
  });
}

function markGhost(o: fabric.FabricObject) {
  const any = o as Ghost;
  any.novelkaGhost = true;
  any.selectable = false;
  any.evented = false;
  any.hasControls = false;
  const kids = any._objects as fabric.FabricObject[] | undefined;
  if (kids?.length) kids.forEach(markGhost);
}

/** Show serialized page objects as a temporary overlay. Not a book page. */
export async function showSerializedPreview(
  data: { objects?: unknown[] } | null | undefined,
  size: { width: number; height: number },
) {
  const c = engine.canvas;
  if (!c) return;
  if (!(await ensureInteriorForPreview())) return;
  await engine.silent(async () => {
    const old = c.getObjects().filter(isGhost);
    if (old.length) c.remove(...old);
    c.discardActiveObject();

    const plate = new fabric.Rect({
      left: 0,
      top: 0,
      width: size.width,
      height: size.height,
      fill: '#ffffff',
      selectable: false,
      evented: false,
    });
    markGhost(plate);
    c.add(plate);

    const raw = Array.isArray(data?.objects) ? data.objects : [];
    if (raw.length) {
      const enlivened = (await fabric.util.enlivenObjects(raw as never)) as fabric.FabricObject[];
      for (const o of enlivened) {
        markGhost(o);
        c.add(o);
      }
    }
    c.requestRenderAll();
  });
}

export function previewIsShowing(): boolean {
  const c = engine.canvas;
  return !!c && c.getObjects().some(isGhost);
}
