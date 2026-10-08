"use client";

import { arc as arcGenerator } from "@visx/shape";
import { type MotionValue, motion, useTransform } from "motion/react";
import { memo, useCallback } from "react";
import { ringCssVars, useRingHover, useRingStable } from "./ring-context";
import { useEnterComplete } from "./use-enter-complete";
import { useMountProgress } from "./use-mount-progress";
import { useChartReducedMotion } from "./use-chart-reduced-motion";

function generateArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius: number
): string {
  const generator = arcGenerator<unknown>({
    innerRadius,
    outerRadius,
    cornerRadius,
  });
  return generator({ startAngle, endAngle } as unknown as null) || "";
}

export type RingLineCap = "round" | "butt";

export interface RingProps {
  /** Index of this ring in the input array */
  index: number;
  /** Overrides this ring's chart token color */
  color?: string;
  /** Enable entrance animation. Default: true */
  animate?: boolean;
  /** Show hover glow. Default: true */
  showGlow?: boolean;
  /** End cap style. Default: "round" */
  lineCap?: RingLineCap;
}

function ringHoverScale(isHovered: boolean, isPushedOut: boolean): number {
  if (isHovered) {
    return 1.03;
  }
  if (isPushedOut) {
    return 1.02;
  }
  return 1;
}

function RingProgressPath({
  progressComplete,
  progressPath,
  animatedProgressPath,
  color,
}: {
  progressComplete: boolean;
  progressPath: string;
  animatedProgressPath: MotionValue<string>;
  color: string;
}) {
  if (progressComplete) {
    if (!progressPath) {
      return null;
    }
    return <path d={progressPath} fill={color} />;
  }
  return <motion.path d={animatedProgressPath} fill={color} />;
}

export const Ring = memo(function Ring({
  index,
  color: colorProp,
  animate = true,
  showGlow = true,
  lineCap = "round",
}: RingProps) {
  const {
    data,
    getColor,
    getRingRadii,
    startAngle,
    endAngle,
    enterTransition,
    enterStaggerScale,
    animationKey,
    geometryScrubbing,
  } = useRingStable();
  const { hoveredIndex, setHoveredIndex } = useRingHover();
  const reducedMotion = useChartReducedMotion();
  const skipMotion = !animate || !!reducedMotion || geometryScrubbing;

  const expandDelay = index * 0.08 * enterStaggerScale;
  const expandProgress = useMountProgress(
    enterTransition,
    expandDelay,
    `${animationKey}-expand-${index}`,
    skipMotion,
  );
  const expandComplete = useEnterComplete(expandProgress);

  const progressDelay = (0.6 + index * 0.1) * enterStaggerScale;
  const progressMount = useMountProgress(
    enterTransition,
    progressDelay,
    `${animationKey}-progress-${index}`,
    skipMotion,
  );
  const progressComplete = useEnterComplete(progressMount);

  const ringData = data[index];
  const valid = ringData && Number.isFinite(ringData.value) && ringData.value >= 0 && Number.isFinite(ringData.maxValue) && ringData.maxValue > 0;
  const progress = valid ? Math.min(1, ringData.value / ringData.maxValue) : 0;
  const arcRange = endAngle - startAngle;

  const animatedProgressPath = useTransform(progressMount, (v) => {
    if (!ringData) {
      return "";
    }
    const currentEndAngle = startAngle + arcRange * progress * v;
    if (Math.abs(currentEndAngle - startAngle) <= 0.01) {
      return "";
    }
    const radii = getRingRadii(index);
    const corner =
      lineCap === "round" ? (radii.outerRadius - radii.innerRadius) / 2 : 0;
    return generateArcPath(
      radii.innerRadius,
      radii.outerRadius,
      startAngle,
      currentEndAngle,
      corner
    );
  });

  const enterScale = useTransform(expandProgress, [0, 1], [0, 1]);

  const handleMouseEnter = useCallback(
    () => setHoveredIndex(index),
    [index, setHoveredIndex]
  );
  const handleMouseLeave = useCallback(
    () => setHoveredIndex(null),
    [setHoveredIndex]
  );

  if (!valid) {
    return null;
  }

  const { innerRadius, outerRadius } = getRingRadii(index);
  const color = colorProp || getColor(index);

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;
  const isPushedOut = hoveredIndex !== null && hoveredIndex < index;

  const cornerRadius =
    lineCap === "round" ? (outerRadius - innerRadius) / 2 : 0;
  const bgPath = generateArcPath(
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    cornerRadius
  );
  const progressEndAngle = startAngle + arcRange * progress;
  const progressPath =
    Math.abs(progressEndAngle - startAngle) <= 0.01
      ? ""
      : generateArcPath(
          innerRadius,
          outerRadius,
          startAngle,
          progressEndAngle,
          cornerRadius
        );

  const hoverScale = ringHoverScale(isHovered, isPushedOut);
  const layerOpacity = isFaded ? 0.35 : 1;
  const enterDone = skipMotion || (expandComplete && progressComplete);

  const groupStyle = {
    cursor: "pointer" as const,
    transformOrigin: "0px 0px",
    filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
  };

  if (enterDone) {
    if (skipMotion) return <g data-slot="ring" data-index={index} data-hovered={isHovered || undefined}
      aria-label={ringData.label} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      style={{ ...groupStyle, transform: `scale(${hoverScale})`, opacity: layerOpacity }}>
      <path d={bgPath} fill={ringCssVars.ringBackground} />
      {progressPath ? <path d={progressPath} fill={color} /> : null}
    </g>;
    return (
      <motion.g
        data-slot="ring" data-index={index} data-hovered={isHovered || undefined} aria-label={ringData.label}
        animate={{ scale: hoverScale, opacity: layerOpacity }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={groupStyle}
        transition={{
          scale: { type: "spring", stiffness: 400, damping: 25 },
          opacity: { duration: 0.15 },
        }}
      >
        <path d={bgPath} fill={ringCssVars.ringBackground} />
        {progressPath ? <path d={progressPath} fill={color} /> : null}
      </motion.g>
    );
  }

  if (!expandComplete) {
    return (
      <motion.g
        data-slot="ring" data-index={index} data-hovered={isHovered || undefined} aria-label={ringData.label}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          ...groupStyle,
          scale: enterScale,
          opacity: layerOpacity,
        }}
      >
        <path d={bgPath} fill={ringCssVars.ringBackground} />
      </motion.g>
    );
  }

  return (
    <motion.g
      data-slot="ring" data-index={index} data-hovered={isHovered || undefined} aria-label={ringData.label}
      animate={{ scale: hoverScale, opacity: layerOpacity }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={groupStyle}
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 25 },
        opacity: { duration: 0.15 },
      }}
    >
      <path d={bgPath} fill={ringCssVars.ringBackground} />
      <RingProgressPath
        animatedProgressPath={animatedProgressPath}
        color={color}
        progressComplete={progressComplete}
        progressPath={progressPath}
      />
    </motion.g>
  );
});

Ring.displayName = "Ring";

export default Ring;
