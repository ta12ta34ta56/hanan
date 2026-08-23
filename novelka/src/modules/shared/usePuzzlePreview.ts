import { useEffect, useRef } from 'react';
import { clearPuzzlePreview, showSerializedPreview } from './puzzle-preview';

/**
 * Keep a temporary puzzle preview on the canvas while a generator is open.
 * Rebuilds when `deps` change. Never writes the book.
 */
export function usePuzzlePreview(
  enabled: boolean,
  factory: () => Promise<{ objects?: unknown[] } | null> | { objects?: unknown[] } | null,
  size: { width: number; height: number },
  deps: unknown[],
) {
  const gen = useRef(0);
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  useEffect(() => {
    if (!enabled) {
      clearPuzzlePreview();
      return;
    }
    const id = ++gen.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await factoryRef.current();
          if (id !== gen.current) return;
          await showSerializedPreview(data, size);
        } catch {
          if (id !== gen.current) return;
          clearPuzzlePreview();
        }
      })();
    }, 90);
    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, size.width, size.height, ...deps]);

  useEffect(() => () => {
    gen.current += 1;
    clearPuzzlePreview();
  }, []);
}
