"use client";

import { animate, useMotionValue, type Transition } from "motion/react";
import { useEffect, useRef } from "react";
import { DEFAULT_CHART_ENTER_TRANSITION } from "./animation";

export function useMountProgress(
  enterTransition: Transition | undefined,
  delaySeconds: number,
  replayKey: number | string,
  reducedMotion: boolean,
) {
  const progress = useMotionValue(reducedMotion ? 1 : 0);
  const transitionRef = useRef(enterTransition);
  transitionRef.current = enterTransition;

  useEffect(() => {
    if (reducedMotion) {
      progress.set(1);
      return;
    }
    progress.set(0);
    const controls = animate(progress, 1, {
      ...(transitionRef.current ?? DEFAULT_CHART_ENTER_TRANSITION),
      delay: delaySeconds,
    });
    return () => controls.stop();
  }, [delaySeconds, replayKey, progress, reducedMotion]);

  return progress;
}
