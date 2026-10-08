"use client";

import type { MotionValue } from "motion/react";
import { motion, useTransform } from "motion/react";
import { memo, useMemo } from "react";
import type { PointerEvent } from "react";
import { radarCssVars, useRadarHover, useRadarStable } from "./radar-context";
import { useEnterComplete } from "./use-enter-complete";
import { useMountProgress } from "./use-mount-progress";

export interface RadarAreaProps {
  /** Index of this area in the data array */
  index: number;
  /** Optional color override */
  color?: string;
  /** Fill opacity when idle. Default: 0.15 */
  fillOpacity?: number;
  /** SVG outline dash pattern, e.g. "4 4" for a previous period. */
  strokeDasharray?: string;
  /** Observe metric-point hover to compose a tooltip through TooltipBox. */
  onPointHover?: (metricKey: string | null, event: PointerEvent<SVGCircleElement>) => void;
  /** Show data point circles. Default: true */
  showPoints?: boolean;
  /** Show stroke outline on the polygon. Default: true */
  showStroke?: boolean;
  /** Show glow effect on hover. Default: true */
  showGlow?: boolean;
  /** Additional class name */
  className?: string;
}

function getStrokeWidth(isHovered: boolean): number {
  return isHovered ? 3 : 2;
}

function positionsToPath(positions: { x: number; y: number }[]): string {
  if (positions.length === 0) {
    return "";
  }
  return `M ${positions.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;
}

const RadarPoint = memo(function RadarPoint({
  mountProgress,
  target,
  color,
  isHovered,
  metricKey,
  enterComplete,
  onPointHover,
}: {
  mountProgress: MotionValue<number>;
  target: { x: number; y: number };
  color: string;
  isHovered: boolean;
  metricKey: string;
  enterComplete: boolean;
  onPointHover?: RadarAreaProps["onPointHover"];
}) {
  const cx = useTransform(mountProgress, (t) => target.x * t);
  const cy = useTransform(mountProgress, (t) => target.y * t);

  if (enterComplete) {
    return (
      <circle
        data-slot="radar-point"
        data-metric={metricKey}
        onPointerEnter={event => onPointHover?.(metricKey, event)}
        onPointerMove={event => onPointHover?.(metricKey, event)}
        onPointerLeave={event => onPointHover?.(null, event)}
        cx={target.x}
        cy={target.y}
        fill={color}
        key={metricKey}
        r={isHovered ? 6 : 4}
        stroke={radarCssVars.background}
        strokeWidth={2}
      />
    );
  }

  return (
    <motion.circle
      data-slot="radar-point"
      data-metric={metricKey}
      onPointerEnter={event => onPointHover?.(metricKey, event)}
      onPointerMove={event => onPointHover?.(metricKey, event)}
      onPointerLeave={event => onPointHover?.(null, event)}
      cx={cx}
      cy={cy}
      fill={color}
      key={metricKey}
      r={isHovered ? 6 : 4}
      stroke={radarCssVars.background}
      strokeWidth={2}
      transition={{
        r: { type: "spring", stiffness: 300, damping: 20 },
      }}
    />
  );
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: radar area enter/hover branches mirror pie slice
export const RadarArea = memo(function RadarArea({
  index,
  color: colorProp,
  fillOpacity = 0.15,
  strokeDasharray,
  onPointHover,
  showPoints = true,
  showStroke = true,
  showGlow = true,
  className = "",
}: RadarAreaProps) {
  const {
    data,
    metrics,
    levels,
    animate,
    enterDurationMs,
    staggerScale,
    enterTransition,
    motionReplayKey,
    getColor,
    getPointPosition,
  } = useRadarStable();
  const { hoveredIndex, setHoveredIndex } = useRadarHover();

  const durationFactor = enterDurationMs / 1100;
  const areaData = data[index];

  const targetPositions = useMemo(() => {
    if (!areaData) {
      return metrics.map(() => ({ x: 0, y: 0 }));
    }
    return metrics.map((metric, i) => {
      const value = areaData.values[metric.key] ?? 0;
      return getPointPosition(i, value);
    });
  }, [metrics, areaData, getPointPosition]);

  const staticPath = useMemo(
    () => positionsToPath(targetPositions),
    [targetPositions]
  );

  const gridStagger = 0.08 * staggerScale * durationFactor;
  const campaignBaseDelay = (levels * gridStagger + 0.2) * durationFactor;
  const campaignStagger = 0.15 * staggerScale * durationFactor;
  const animationDelay = campaignBaseDelay + index * campaignStagger;

  const mountProgress = useMountProgress(
    enterTransition,
    animationDelay,
    `${motionReplayKey}-${index}`,
    !animate,
  );
  const enterComplete = useEnterComplete(mountProgress);

  const animatedPositions = useTransform(mountProgress, (t) =>
    targetPositions.map((p) => ({ x: p.x * t, y: p.y * t }))
  );

  const pathD = useTransform(animatedPositions, positionsToPath);

  if (!areaData || metrics.length < 3) {
    return null;
  }

  const color = colorProp || getColor(index);
  const resolvedFillOpacity = Number.isFinite(fillOpacity) ? Math.max(0, Math.min(1, fillOpacity)) : 0.15;
  const isHovered = hoveredIndex === index;
  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

  return (
    <motion.g
      data-slot="radar-area"
      data-index={index}
      data-hovered={isHovered || undefined}
      aria-label={areaData.label}
      animate={{
        opacity: isOtherHovered ? 0.3 : 1,
        scale: isHovered ? 1.05 : 1,
      }}
      className={className}
      initial={{ opacity: animate ? 0 : 1 }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      style={{ transformOrigin: "0px 0px", cursor: "pointer" }}
      transition={{
        opacity: { duration: animate ? 0.15 : 0 },
        scale: animate ? { type: "spring", stiffness: 400, damping: 25 } : { duration: 0 },
      }}
    >
      {enterComplete ? (
        <path
          d={staticPath}
          fill={color}
          fillOpacity={isHovered && resolvedFillOpacity > 0 ? Math.min(1, resolvedFillOpacity + 0.2) : resolvedFillOpacity}
          strokeDasharray={strokeDasharray}
          stroke={showStroke ? color : "none"}
          strokeLinejoin="round"
          strokeWidth={showStroke ? getStrokeWidth(isHovered) : 0}
          style={{
            filter:
              showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
          }}
        />
      ) : (
        <motion.path
          initial={{ fillOpacity: resolvedFillOpacity, strokeWidth: showStroke ? 2 : 0 }}
          animate={{
            fillOpacity: isHovered && resolvedFillOpacity > 0 ? Math.min(1, resolvedFillOpacity + 0.2) : resolvedFillOpacity,
            strokeWidth: showStroke ? getStrokeWidth(isHovered) : 0,
          }}
          d={pathD}
          fill={color}
          stroke={showStroke ? color : "none"}
          strokeDasharray={strokeDasharray}
          strokeLinejoin="round"
          style={{
            filter:
              showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
          }}
          transition={{
            fillOpacity: { duration: 0.2 },
            strokeWidth: { duration: 0.2 },
          }}
        />
      )}

      {showPoints &&
        metrics.map((metric, i) => {
          const target = targetPositions[i];
          if (!target) {
            return null;
          }
          return (
            <RadarPoint
              color={color}
              enterComplete={enterComplete}
              isHovered={isHovered}
              onPointHover={onPointHover}
              key={metric.key}
              metricKey={metric.key}
              mountProgress={mountProgress}
              target={target}
            />
          );
        })}
    </motion.g>
  );
});

RadarArea.displayName = "RadarArea";

export default RadarArea;
