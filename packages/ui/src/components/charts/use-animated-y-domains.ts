"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ChartPhase } from "./chart-phase";
import { LINE_LOADING_PULSE_EASE } from "./line-loading-timing";
import {
  domainsEqual,
  isYDomainTweenPhase,
  resolveAnimatedYDestinationDomains,
  shouldTweenYDomain,
  type YDomain,
} from "./y-domain-utils";

function lerpDomain(from: YDomain, to: YDomain, progress: number): YDomain {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ];
}

function snapDomains(
  domains: Record<string, YDomain>,
  setAnimatedByAxis: (domains: Record<string, YDomain>) => void,
  animatedRef: { current: Record<string, YDomain> }
) {
  if (domainsEqual(animatedRef.current, domains)) {
    return;
  }
  setAnimatedByAxis(domains);
  animatedRef.current = domains;
}

function tweenDomains({
  destination,
  durationMs,
  enabled,
  reducedMotion,
  animatedRef,
  setAnimatedByAxis,
  onSettled,
}: {
  destination: Record<string, YDomain>;
  durationMs: number;
  enabled: boolean;
  reducedMotion: boolean | null;
  animatedRef: { current: Record<string, YDomain> };
  setAnimatedByAxis: (domains: Record<string, YDomain>) => void;
  onSettled?: () => void;
}) {
  if (domainsEqual(animatedRef.current, destination)) {
    onSettled?.();
    return;
  }

  if (!enabled || reducedMotion || durationMs <= 0) {
    snapDomains(destination, setAnimatedByAxis, animatedRef);
    onSettled?.();
    return;
  }

  const axisIds = Object.keys(destination);
  const fromSnapshot = animatedRef.current;

  let needsTween = false;
  for (const axisId of axisIds) {
    const from =
      fromSnapshot[axisId] ?? destination[axisId] ?? ([0, 100] as YDomain);
    const to = destination[axisId] ?? from;
    if (shouldTweenYDomain(from, to)) {
      needsTween = true;
      break;
    }
  }

  if (!needsTween) {
    snapDomains(destination, setAnimatedByAxis, animatedRef);
    onSettled?.();
    return;
  }

  const fromByAxis: Record<string, YDomain> = {};
  for (const axisId of axisIds) {
    fromByAxis[axisId] = fromSnapshot[axisId] ??
      destination[axisId] ?? [0, 100];
  }

  const control = animate(0, 1, {
    duration: durationMs / 1000,
    ease: [...LINE_LOADING_PULSE_EASE],
    onUpdate: (progress) => {
      const next: Record<string, YDomain> = {};
      for (const axisId of axisIds) {
        const from =
          fromByAxis[axisId] ?? destination[axisId] ?? ([0, 100] as YDomain);
        const to = destination[axisId] ?? from;
        next[axisId] = shouldTweenYDomain(from, to)
          ? lerpDomain(from, to, progress)
          : to;
      }
      animatedRef.current = next;
      setAnimatedByAxis(next);
    },
    onComplete: () => {
      snapDomains(destination, setAnimatedByAxis, animatedRef);
      onSettled?.();
    },
  });

  return control;
}

export interface UseAnimatedYDomainsOptions {
  enabled: boolean;
  durationMs: number;
  chartPhase: ChartPhase;
  skeletonByAxis: Record<string, YDomain>;
  targetByAxis: Record<string, YDomain>;
  onSettled?: () => void;
  /** When true, tweens y-domains on target changes while the chart is in the ready phase (e.g. brush zoom). */
  tweenOnTargetChange?: boolean;
}

export function useAnimatedYDomains({
  enabled,
  durationMs,
  chartPhase,
  skeletonByAxis,
  targetByAxis,
  onSettled,
  tweenOnTargetChange = false,
}: UseAnimatedYDomainsOptions): Record<string, YDomain> {
  const reducedMotion = useReducedMotion();
  const destinationByAxis = resolveAnimatedYDestinationDomains(
    chartPhase,
    skeletonByAxis,
    targetByAxis
  );
  const destinationRef = useRef(destinationByAxis);
  destinationRef.current = destinationByAxis;

  const [animatedByAxis, setAnimatedByAxis] = useState(destinationByAxis);
  const animatedRef = useRef(animatedByAxis);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const destinationSignature = JSON.stringify(destinationByAxis);

  // One effect owns the active tween. A target or option change cancels the
  // old control and continues from the current domain, or snaps when disabled.
  useEffect(() => {
    const destination = destinationRef.current;
    const tweenPhase = isYDomainTweenPhase(chartPhase);
    if (tweenPhase || (chartPhase === "ready" && tweenOnTargetChange && !domainsEqual(animatedRef.current, destination))) {
      const control = tweenDomains({
        destination,
        durationMs,
        enabled,
        reducedMotion,
        animatedRef,
        setAnimatedByAxis,
        onSettled: () => onSettledRef.current?.(),
      });

      return () => control?.stop();
    }

    snapDomains(destination, setAnimatedByAxis, animatedRef);
  }, [
    chartPhase,
    durationMs,
    enabled,
    reducedMotion,
    destinationSignature,
    tweenOnTargetChange,
  ]);

  return animatedByAxis;
}
