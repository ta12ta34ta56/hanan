import { useSelection } from '../../hooks/useSelection';
import { rectInBleed, type CoverGuideGeom, type Rect } from '../../services/cover-guides';

/**
 * KDP-style cover overlay (DOM only — never in page.data / export).
 *
 * Matches Amazon's wraparound template:
 *   PINK/RED FILL — the bleed band that will be trimmed (like Show bleed zone)
 *   BLACK line    — trim cut
 *   BLUE dashed   — spine folds
 *   YELLOW box    — barcode keep-out (2" × 1.2")
 */

type Props = {
  pageWidth: number;
  pageHeight: number;
  zoom: number;
  geom: CoverGuideGeom;
  activeSnapV?: number[];
  activeSnapH?: number[];
};

const NEAR = 0.5;

export function CoverGuides({
  pageWidth,
  pageHeight,
  geom,
  activeSnapV,
  activeSnapH,
}: Props) {
  const selection = useSelection();

  const primary = selection.primary as { getBoundingRect?: () => Rect } | null;
  const rect = primary?.getBoundingRect?.() ?? null;
  const textInBleed = selection.isText && !!rect && rectInBleed(geom, rect);

  const snapV = new Set(activeSnapV ?? []);
  const snapH = new Set(activeSnapH ?? []);

  const rectSnapped = (r: Rect) => {
    const hitV = [...snapV].some(
      (s) => Math.abs(s - r.left) <= NEAR || Math.abs(s - (r.left + r.width)) <= NEAR,
    );
    const hitH = [...snapH].some(
      (s) => Math.abs(s - r.top) <= NEAR || Math.abs(s - (r.top + r.height)) <= NEAR,
    );
    return hitV || hitH;
  };

  const foldTop = geom.bleed;
  const foldBottom = geom.bleed + geom.trim.height;
  const t = geom.trim;
  const b = geom.barcode;

  const bleedRing = [
    `M 0 0 H ${pageWidth} V ${pageHeight} H 0 Z`,
    `M ${t.left} ${t.top} H ${t.left + t.width} V ${t.top + t.height} H ${t.left} Z`,
  ].join(' ');

  return (
    <>
      <svg
        className="cover-guides"
        viewBox={`0 0 ${pageWidth} ${pageHeight}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="cover-bleed-fill" fillRule="evenodd" d={bleedRing} />
        <rect
          className="cover-line-trim"
          x={t.left}
          y={t.top}
          width={t.width}
          height={t.height}
          data-snapped={rectSnapped(t)}
        />
        <line
          className="cover-line-spine"
          x1={geom.spineFoldLeft} y1={foldTop}
          x2={geom.spineFoldLeft} y2={foldBottom}
          data-snapped={[...snapV].some((s) => Math.abs(s - geom.spineFoldLeft) <= NEAR)}
        />
        <line
          className="cover-line-spine"
          x1={geom.spineFoldRight} y1={foldTop}
          x2={geom.spineFoldRight} y2={foldBottom}
          data-snapped={[...snapV].some((s) => Math.abs(s - geom.spineFoldRight) <= NEAR)}
        />
        <rect
          className="cover-barcode-box"
          x={b.left}
          y={b.top}
          width={b.width}
          height={b.height}
          data-snapped={rectSnapped(b)}
        />
      </svg>

      {textInBleed && (
        <div className="cover-bleed-warning">
          Text is in the bleed area — it will be trimmed off in print.
        </div>
      )}
    </>
  );
}
