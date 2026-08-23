import { useRef, useState } from 'react';
import * as fabric from 'fabric';
import { engine, type FabricAny } from '../../engine/canvas-engine';
import { ClosePanelButton } from '../ClosePanelButton';
import { loadFont, registerUploadedFont } from '../../engine/font-manager';
import { useCanvasStore } from '../../stores/canvas-store';
import { useToastStore } from '../../stores/toast-store';
import { useTextStyleStore } from '../../stores/text-style-store';
import { useSelection } from '../../hooks/useSelection';
import { FontLibrary } from '../editor/FontLibrary';

const PRESETS = [
  { label: 'Heading', size: 44, weight: 'bold' as const, text: 'Heading' },
  { label: 'Body', size: 16, weight: 'normal' as const, text: 'Body text goes here' },
];

export function TextPanel() {
  const setStatus = useToastStore((s) => s.setStatus);
  const { fontFamily, setFontFamily } = useTextStyleStore();
  const sel = useSelection();
  const [uploading, setUploading] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const ghostRef = useRef<fabric.Textbox | null>(null);

  const previewValue = previewText.trim();

  const clearFontGhost = () => {
    const c = engine.canvas;
    if (c && ghostRef.current) {
      c.remove(ghostRef.current);
      c.requestRenderAll();
    }
    ghostRef.current = null;
  };

  const showFontGhost = async ({
    text,
    font,
    size,
    weight,
    fill,
  }: {
    text: string;
    font: string;
    size: number;
    weight: string;
    fill: string;
  }) => {
    const c = engine.canvas;
    if (!c) return;
    await loadFont(font);
    clearFontGhost();
    const ghost = new fabric.Textbox(text || 'Preview text', {
      left: engine.pageWidth / 2,
      top: engine.pageHeight / 2,
      originX: 'center',
      originY: 'center',
      width: Math.min(engine.pageWidth * 0.8, Math.max(240, size * 9)),
      fontSize: size,
      fontWeight: weight,
      fontFamily: font,
      fill,
      opacity: 0.36,
      textAlign: 'center',
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (ghost as FabricAny).novelkaGhost = true;
    (ghost as FabricAny).name = 'Font preview';
    c.add(ghost);
    c.requestRenderAll();
    ghostRef.current = ghost;
  };

  const choose = async (family: string) => {
    setFontFamily(family);
    await loadFont(family);
    const c = engine.canvas;
    if (c && sel.isText) {
      c.getActiveObjects().forEach((o) => o.set('fontFamily' as never, family as never));
      c.requestRenderAll();
      useCanvasStore.getState().commit('Font');
    }
  };

  const add = async (p: (typeof PRESETS)[number]) => {
    clearFontGhost();
    await loadFont(fontFamily);
    engine.addText(previewValue || p.text, {
      fontSize: p.size,
      fontWeight: p.weight,
      fontFamily,
      width: Math.max(200, p.size * 9),
    });
    setStatus('success', `${p.label} added`);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      let last = '';
      for (const f of Array.from(files)) {
        const def = await registerUploadedFont(f);
        last = def.family;
      }
      if (last) await choose(last);
      setStatus('success', `${files.length} font file(s) loaded for this session`);
    } catch {
      setStatus('error', 'Could not load that font file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Text</span>
        <ClosePanelButton />
      </div>
      <div className="panel-body">
        <div className="text-presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="text-preset"
              onClick={() => void add(p)}
              onMouseEnter={() => void showFontGhost({ text: previewValue || p.text, font: fontFamily, size: p.size, weight: p.weight, fill: '#111827' })}
              onMouseLeave={clearFontGhost}
            >
              <span
                style={{
                  display: 'block',
                  background: 'transparent',
                  color: 'var(--text)',
                  padding: '2px 0',
                  fontWeight: p.weight === 'bold' ? 700 : 400,
                  fontSize: p.weight === 'bold' ? 16 : 12,
                }}
              >
                {previewValue || p.label}
              </span>
            </button>
          ))}
        </div>

        <input
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Type…"
          aria-label="Type custom text for font previews"
        />
        <FontLibrary
          activeFamily={fontFamily}
          onChoose={choose}
          previewText={previewValue}
          onPreview={showFontGhost}
          onEndPreview={clearFontGhost}
        />
        <label className="ink-quiet-btn">
          {uploading ? 'Loading…' : 'Your font'}
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            multiple
            hidden
            onChange={(e) => void upload(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
