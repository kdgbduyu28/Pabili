import { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { MAX_WIDTH } from '../theme';

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const GRID_GAP = 8;
export const GRID_PAD = 8;

/** How many product columns fit in a given width, and how wide each card is. */
export function gridFor(content: number) {
  const columns = content < 600 ? 2 : content < 900 ? 3 : content < 1100 ? 4 : 5;
  const cardWidth = Math.floor((content - GRID_PAD * 2 - GRID_GAP * (columns - 1)) / columns);
  return { columns, cardWidth };
}

/** Window-based estimate. Prefer useMeasuredWidth for anything that must fit exactly. */
export function useGrid() {
  const { width } = useWindowDimensions();
  const content = Math.min(width, MAX_WIDTH);
  return { width, content, ...gridFor(content), wide: width >= 768 };
}

/**
 * The real width a view gets. The window width overstates it on desktop web,
 * where a scroll container's scrollbar eats ~15px, which made 2-column grids
 * wrap to one card per row. Falls back to the window estimate until laid out.
 */
export function useMeasuredWidth(fallbackInset = 0) {
  const { content } = useGrid();
  const [measured, setMeasured] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    setMeasured((prev) => (prev === w ? prev : w));
  }, []);
  return { width: measured || content - fallbackInset, onLayout };
}
