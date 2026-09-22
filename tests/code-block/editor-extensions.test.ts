// @vitest-environment jsdom

import { describe, expect, test } from 'vitest';

import { matchesEditPredictionPattern } from '../../packages/ui/src/system/code-engine/editor/editPrediction';
import { markerSeverityDatasetKey } from '../../packages/ui/src/system/code-engine/editor/marker';
import { setPopoverPositionStyles } from '../../packages/ui/src/system/code-engine/editor/popover';

describe('code editor extensions', () => {
  test('maps marker severities to stable DOM data keys', () => {
    expect(markerSeverityDatasetKey('error')).toBe('markerError');
    expect(markerSeverityDatasetKey('warning')).toBe('markerWarning');
    expect(markerSeverityDatasetKey('info')).toBe('markerInfo');
    expect(markerSeverityDatasetKey('hint')).toBe('markerHint');
  });

  test('positions popovers inside the active viewport and clears stale bounds', () => {
    const popover = document.createElement('div');
    setPopoverPositionStyles(popover, {
      gutterWidth: 44,
      placeAbove: true,
      viewport: { left: 10, right: 610, top: 20, bottom: 420 },
      x: 120,
      y: 240,
    });

    expect(popover.style.getPropertyValue('--gutter-width')).toBe('44px');
    expect(popover.style.getPropertyValue('--popover-y-shift')).toBe('-100%');
    expect(popover.style.getPropertyValue('--popover-viewport-bottom')).toBe('420px');

    setPopoverPositionStyles(popover, {
      gutterWidth: 0,
      placeAbove: false,
      viewport: undefined,
      x: 0,
      y: 0,
    });
    expect(popover.style.getPropertyValue('--popover-y-shift')).toBe('0px');
    expect(popover.style.getPropertyValue('--popover-viewport-bottom')).toBe('');
  });

  test('matches prediction include and exclude patterns without sharing regex state', () => {
    expect(matchesEditPredictionPattern('src/editor/file.ts', 'src/**/*.ts')).toBe(true);
    expect(matchesEditPredictionPattern('src/editor/file.tsx', 'src/**/*.ts')).toBe(false);
    const pattern = /editor\/file\.ts/g;
    expect(matchesEditPredictionPattern('src/editor/file.ts', pattern)).toBe(true);
    expect(matchesEditPredictionPattern('src/editor/file.ts', pattern)).toBe(true);
  });
});
