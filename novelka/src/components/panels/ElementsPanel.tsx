import { useMemo, useState } from 'react';
import {
  BORDERS,
  DIVIDERS,
  ICONS,
  PATTERNS,
  STICKERS,
  searchAssets,
  type Asset,
} from '../../services/asset-library';
import { engine } from '../../engine/canvas-engine';
import { useToastStore } from '../../stores/toast-store';
import { ShapesSection } from './ShapePanel';
import { ClosePanelButton } from '../ClosePanelButton';

type ElementKind = 'shapes' | 'stickers' | 'icons' | 'patterns' | 'borders' | 'dividers';

type ElementSection = {
  kind: ElementKind;
  title: string;
  list: Asset[];
  layout: 'grid' | 'wide' | 'tall';
  cols: number;
};

const SECTIONS: ElementSection[] = [
  { kind: 'stickers', title: 'Stickers', list: STICKERS, layout: 'grid', cols: 3 },
  { kind: 'icons', title: 'Icons', list: ICONS, layout: 'grid', cols: 4 },
  { kind: 'patterns', title: 'Patterns', list: PATTERNS, layout: 'tall', cols: 3 },
  { kind: 'borders', title: 'Corners', list: BORDERS, layout: 'grid', cols: 3 },
  { kind: 'dividers', title: 'Lines', list: DIVIDERS, layout: 'wide', cols: 1 },
];

const FILTERS: { key: ElementKind; label: string }[] = [
  { key: 'shapes', label: 'Shapes' },
  { key: 'stickers', label: 'Art' },
  { key: 'icons', label: 'Icons' },
  { key: 'borders', label: 'Corners' },
  { key: 'dividers', label: 'Lines' },
  { key: 'patterns', label: 'Patterns' },
];

export function ElementsPanel() {
  const [filter, setFilter] = useState<ElementKind>('shapes');
  const [query, setQuery] = useState('');
  const setStatus = useToastStore((s) => s.setStatus);

  const section = useMemo(() => {
    if (filter === 'shapes') return null;
    const found = SECTIONS.find((s) => s.kind === filter);
    if (!found) return null;
    return { ...found, list: searchAssets(found.list, query) };
  }, [filter, query]);

  const place = async (asset: Asset) => {
    try {
      setStatus('busy', `Adding ${asset.name}…`);
      if (asset.src.endsWith('.svg')) {
        await engine.addSVGFromURL(asset.src, { name: asset.name });
      } else {
        await engine.addImageFromURL(asset.src, {
          elementType: asset.kind === 'icon' ? 'icon' : 'sticker',
          name: asset.name,
        });
      }
      setStatus('success', `${asset.name} added`);
    } catch {
      setStatus('error', `Could not add ${asset.name}`);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Elements</span>
        <ClosePanelButton />
      </div>
      <div className="panel-body">
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search elements"
        />

        {filter === 'shapes' && <ShapesSection query={query} />}

        {section && section.list.length === 0 && (
          <div className="empty">Nothing matches.</div>
        )}

        {section && section.list.length > 0 && (
          <div
            className={section.layout === 'wide' ? 'stack' : section.cols === 4 ? 'grid-4' : 'grid-3'}
            style={section.layout === 'wide' ? { gap: 6 } : undefined}
          >
            {section.list.map((asset) => (
              <div key={asset.id} className="asset-cell">
                <div
                  className={`tile ${section.layout === 'wide' ? 'wide' : section.layout === 'tall' ? 'tall' : ''}`}
                  draggable
                  title={asset.name}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-novelka-asset', asset.src);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => void place(asset)}
                >
                  <span
                    className="tile-art"
                    role="img"
                    aria-label={asset.name}
                    style={{
                      background: 'var(--text)',
                      WebkitMaskImage: `url(${asset.src})`,
                      maskImage: `url(${asset.src})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
