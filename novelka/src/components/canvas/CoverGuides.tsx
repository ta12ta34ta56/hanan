import { useSelection } from '../../hooks/useSelection';
import { rectInBleed, type CoverGuideGeom, type Rect } from '../../services/cover-guides';
import { IN } from '../../types/canvas.types';

/**
 * KDP-style cover overlay (DOM only — never in page.data / export).
 *
 * Matches Amazon's wraparound template (PAPERBACK_…_en_US):
 *   PINK/RED FILL — bleed band on every outer edge, INCLUDING across the spine
 *   BLACK line    — trim cut (full wrap + the two spine-edge panel lines)
 *   BLUE dashed   — spine folds
 *   YELLOW box    — barcode keep-out (2" × 1.2")
 *   MEASUREMENT TEXTS — live numbers from calculateCover, same places as KDP
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

function inchLabel(n: number, digits = 3): string {
  const rounded = Number(n.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits);
}

function mmLabel(inches: number): string {
  return (inches * 25.4).toFixed(2);
}

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
  const back = geom.back;
  const front = geom.front;
  const spine = geom.spine;
  const spec = geom.spec;

  const trimWIn = spec.trimWidth / IN;
  const trimHIn = spec.trimHeight / IN;
  const totalWIn = spec.totalWidth / IN;
  const totalHIn = spec.totalHeight / IN;
  const spineIn = spec.spineInches;
  const paperLabel = spec.paper === 'cream' ? 'Cream Paper' : 'White Paper';
  const bindingLabel = spec.binding === 'hardcover' ? 'Hardcover Book' : 'Paperback Book';

  // Even-odd ring = the whole wrap minus the trim hole. That ring already
  // includes the spine's top and bottom bleed. Extra spine strips below make
  // that red unmistakable (the bit the owner called out).
  const bleedRing = [
    `M 0 0 H ${pageWidth} V ${pageHeight} H 0 Z`,
    `M ${t.left} ${t.top} H ${t.left + t.width} V ${t.top + t.height} H ${t.left} Z`,
  ].join(' ');

  const fsTitle = Math.max(13, front.width * 0.042);
  const fsSub = Math.max(9, front.width * 0.028);
  const fsSmall = Math.max(7.5, front.width * 0.022);
  const fsTiny = Math.max(6.5, back.width * 0.02);
  const fsSpine = Math.max(6, Math.min(spine.width * 0.55, 11));
  const cxFront = front.left + front.width / 2;
  const cxSpine = spine.left + spine.width / 2;
  const cySpine = spine.top + spine.height / 2;

  return (
    <>
      <svg
        className="cover-guides"
        viewBox={`0 0 ${pageWidth} ${pageHeight}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="cover-bleed-fill" fillRule="evenodd" d={bleedRing} />
        {/* Extra-visible red on the spine — top and bottom bleed of the wrap. */}
        <rect
          className="cover-bleed-spine"
          x={spine.left}
          y={0}
          width={spine.width}
          height={geom.bleed}
        />
        <rect
          className="cover-bleed-spine"
          x={spine.left}
          y={pageHeight - geom.bleed}
          width={spine.width}
          height={geom.bleed}
        />

        <rect
          className="cover-line-trim"
          x={t.left}
          y={t.top}
          width={t.width}
          height={t.height}
          data-snapped={rectSnapped(t)}
        />
        {/* Official template boxes each panel: black verticals at the spine edges. */}
        <line
          className="cover-line-trim"
          x1={geom.spineFoldLeft} y1={foldTop}
          x2={geom.spineFoldLeft} y2={foldBottom}
        />
        <line
          className="cover-line-trim"
          x1={geom.spineFoldRight} y1={foldTop}
          x2={geom.spineFoldRight} y2={foldBottom}
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

        {/* —— measurement texts (same places as Amazon's template layer) —— */}
        <text
          className="cover-guide-copy cover-guide-legend"
          x={back.left + back.width * 0.08}
          y={back.top + back.height * 0.08}
          fontSize={fsTiny}
        >
          Black solid = trim
        </text>
        <text
          className="cover-guide-copy cover-guide-legend"
          x={back.left + back.width * 0.08}
          y={back.top + back.height * 0.08 + fsTiny * 1.45}
          fontSize={fsTiny}
        >
          Blue dashed = spine fold
        </text>
        <text
          className="cover-guide-copy cover-guide-legend"
          x={back.left + back.width * 0.08}
          y={back.top + back.height * 0.08 + fsTiny * 2.9}
          fontSize={fsTiny}
        >
          Red area = bleed (will be trimmed)
        </text>

        <text
          className="cover-guide-copy cover-guide-title"
          x={cxFront}
          y={front.top + front.height * 0.18}
          textAnchor="middle"
          fontSize={fsTitle}
        >
          {bindingLabel}
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.18 + fsTitle * 1.15}
          textAnchor="middle"
          fontSize={fsSub}
        >
          Cover Template — Left to Right
        </text>
        <text
          className="cover-guide-copy cover-guide-title"
          x={cxFront}
          y={front.top + front.height * 0.38}
          textAnchor="middle"
          fontSize={fsTitle}
        >
          {inchLabel(trimWIn)}" × {inchLabel(trimHIn)}" Book
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.38 + fsSub * 1.2}
          textAnchor="middle"
          fontSize={fsSmall}
        >
          ({mmLabel(trimWIn)}mm × {mmLabel(trimHIn)}mm)
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.54}
          textAnchor="middle"
          fontSize={fsSub}
        >
          {inchLabel(totalWIn)}" × {inchLabel(totalHIn)}" Overall
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.54 + fsSmall * 1.25}
          textAnchor="middle"
          fontSize={fsSmall}
        >
          ({mmLabel(totalWIn)}mm × {mmLabel(totalHIn)}mm)
        </text>
        <text
          className="cover-guide-copy cover-guide-title"
          x={cxFront}
          y={front.top + front.height * 0.68}
          textAnchor="middle"
          fontSize={fsSub}
        >
          {inchLabel(spineIn)}" Spine Width
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.68 + fsSmall * 1.25}
          textAnchor="middle"
          fontSize={fsSmall}
        >
          ({mmLabel(spineIn)}mm)
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.82}
          textAnchor="middle"
          fontSize={fsSub}
        >
          Black {'&'} White
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.82 + fsSub * 1.2}
          textAnchor="middle"
          fontSize={fsSub}
        >
          {spec.pageCount} Pages
        </text>
        <text
          className="cover-guide-copy"
          x={cxFront}
          y={front.top + front.height * 0.82 + fsSub * 2.4}
          textAnchor="middle"
          fontSize={fsSub}
        >
          {paperLabel}
        </text>

        <text
          className="cover-guide-copy"
          x={back.left + back.width * 0.08}
          y={back.top + back.height - 10}
          fontSize={fsTiny}
        >
          Back Cover {inchLabel(trimWIn)}" × {inchLabel(trimHIn)}"
        </text>
        <text
          className="cover-guide-copy"
          x={front.left + front.width - front.width * 0.08}
          y={front.top + front.height - 10}
          textAnchor="end"
          fontSize={fsTiny}
        >
          Front Cover {inchLabel(trimWIn)}" × {inchLabel(trimHIn)}"
        </text>

        <text
          className="cover-guide-copy cover-guide-spine-copy"
          x={cxSpine}
          y={cySpine}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fsSpine}
          transform={`rotate(-90 ${cxSpine} ${cySpine})`}
        >
          Spine Width {inchLabel(spineIn)}" ({mmLabel(spineIn)} mm)
        </text>

        <text
          className="cover-guide-barcode-copy"
          x={b.left + b.width / 2}
          y={b.top + b.height / 2 - 7}
          textAnchor="middle"
          fontSize={Math.max(8, b.height * 0.18)}
        >
          Barcode
        </text>
        <text
          className="cover-guide-barcode-copy"
          x={b.left + b.width / 2}
          y={b.top + b.height / 2 + 6}
          textAnchor="middle"
          fontSize={Math.max(7, b.height * 0.16)}
        >
          {'2.000" × 1.200"'}
        </text>
        <text
          className="cover-guide-barcode-copy"
          x={b.left + b.width / 2}
          y={b.top + b.height / 2 + 18}
          textAnchor="middle"
          fontSize={Math.max(6.5, b.height * 0.14)}
        >
          (50.80mm × 30.48mm)
        </text>
      </svg>

      {textInBleed && (
        <div className="cover-bleed-warning">
          Text is in the bleed area — it will be trimmed off in print.
        </div>
      )}
    </>
  );
}
