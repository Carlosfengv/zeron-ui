"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useState } from "react";

export function useEnterComplete(progress: MotionValue<number>): boolean {
  const [complete, setComplete] = useState(() => progress.get() >= 1);

  useEffect(() => {
    setComplete(progress.get() >= 1);
    // Observe resets as well as completion when a segment's index changes.
    return progress.on("change", (value) => {
      if (value <= 0) setComplete(false);
      else if (value >= 1) setComplete(true);
    });
  }, [progress]);

  return complete;
}
