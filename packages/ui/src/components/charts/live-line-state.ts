import type { LiveLinePoint } from "./live-line-chart";
const LIVE_FRAME_COMMIT_MS = 32;
export interface AnimFrame {
  now: number;
  yMin: number;
  yMax: number;
  displayValue: number;
}

export function computeTargetRange(
  data: LiveLinePoint[],
  value: number,
  exaggerate: boolean
) {
  let min = value;
  let max = value;
  for (const d of data) {
    if (d.value < min) {
      min = d.value;
    }
    if (d.value > max) {
      max = d.value;
    }
  }
  if (value < min) {
    min = value;
  }
  if (value > max) {
    max = value;
  }
  const rawRange = max - min;
  const paddingFactor = exaggerate ? 0.03 : 0.15;
  const rangePad = rawRange * paddingFactor || (exaggerate ? 0.04 : 10);
  return { yMin: min - rangePad, yMax: max + rangePad };
}

export function nextAnimFrame(
  prev: AnimFrame,
  targetRange: { yMin: number; yMax: number },
  targetValue: number,
  speed: number,
  isPaused: boolean
): AnimFrame {
  const nextNow = isPaused ? prev.now : Date.now();
  const nextYMin =
    targetRange.yMin < prev.yMin
      ? targetRange.yMin
      : prev.yMin + (targetRange.yMin - prev.yMin) * speed;
  const nextYMax =
    targetRange.yMax > prev.yMax
      ? targetRange.yMax
      : prev.yMax + (targetRange.yMax - prev.yMax) * speed;
  const nextValue =
    prev.displayValue + (targetValue - prev.displayValue) * speed;
  return {
    now: nextNow,
    yMin: nextYMin,
    yMax: nextYMax,
    displayValue: nextValue,
  };
}

export function interpolateAtTime(
  points: LiveLinePoint[],
  timeSec: number
): number | null {
  if (points.length === 0) {
    return null;
  }
  const firstPt = points[0] as LiveLinePoint;
  const lastPt = points.at(-1) as LiveLinePoint;
  if (timeSec <= firstPt.time) {
    return firstPt.value;
  }
  if (timeSec >= lastPt.time) {
    return lastPt.value;
  }
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const midPt = points[mid];
    if (midPt && midPt.time <= timeSec) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const p1 = points[lo];
  if (!p1) {
    return null;
  }
  const p2 = points[hi];
  if (!p2) {
    return null;
  }
  const dt = p2.time - p1.time;
  if (dt === 0) {
    return p1.value;
  }
  const t = (timeSec - p1.time) / dt;
  return p1.value + (p2.value - p1.value) * t;
}


export function shouldCommitLiveUpdates(
  now: number,
  lastFrameCommit: number,
  tooltipKey: string | null,
  lastTooltipKey: string | null
): { commitFrame: boolean; commitTooltip: boolean } {
  const commitFrame = now - lastFrameCommit >= LIVE_FRAME_COMMIT_MS;
  const commitTooltip = commitFrame && tooltipKey !== lastTooltipKey;
  return { commitFrame, commitTooltip };
}
