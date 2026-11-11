'use client';

import { useState, useCallback } from 'react';

export type CardSize = 'standard' | 'expanded' | 'fullscreen';

export function useCardSize(initialSize: CardSize = 'standard') {
  const [size, setSize] = useState<CardSize>(initialSize);

  const cycleSize = useCallback(() => {
    setSize((prev) => {
      switch (prev) {
        case 'standard':
          return 'expanded';
        case 'expanded':
          return 'fullscreen';
        case 'fullscreen':
          return 'standard';
      }
    });
  }, []);

  const setStandard = useCallback(() => setSize('standard'), []);
  const setExpanded = useCallback(() => setSize('expanded'), []);
  const setFullscreen = useCallback(() => setSize('fullscreen'), []);

  return {
    size,
    setSize,
    cycleSize,
    setStandard,
    setExpanded,
    setFullscreen,
    isStandard: size === 'standard',
    isExpanded: size === 'expanded',
    isFullscreen: size === 'fullscreen',
  };
}
