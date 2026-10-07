import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
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

/** Content width (capped on desktop web) and how many product columns fit. */
export function useGrid() {
  const { width } = useWindowDimensions();
  const content = Math.min(width, MAX_WIDTH);
  const columns = content < 600 ? 2 : content < 900 ? 3 : content < 1100 ? 4 : 5;
  const cardWidth = Math.floor((content - GRID_PAD * 2 - GRID_GAP * (columns - 1)) / columns);
  return { width, content, columns, cardWidth, wide: width >= 768 };
}
