"use client";

import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { chartSeriesColor } from "@zeron/ui/chart-primitives";
import { cn } from "@zeron/ui/system/utils";
import { ModelLogo } from "./model-logo";
import type { ModelRouterRoute } from "./model-router-types";

/** Browser-owned motion: no per-frame React state or randomized hydration markup. */
export const RouterFlow = memo(function RouterFlow({ routes, animated, gateway, locale, activeRouteId, onHoverRoute, onFocusRoute }: {
  routes: readonly ModelRouterRoute[]; animated: boolean; gateway: string; locale: string;
  activeRouteId?: string | null;
  onHoverRoute?: (id: string | null) => void;
  onFocusRoute?: (id: string | null) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(32, entry.contentRect.width)));
    if (canvas.current) observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    // Keep visibility and motion preference current even while manually paused.
    // Unsupported environments retain a readable static chart.
    if (typeof window.matchMedia !== "function" || typeof IntersectionObserver === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => setRunning(visible && !document.hidden && !media.matches);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const height = Math.max(1, routes.length) * 44;
  const center = height / 2;
  const maxRate = Math.max(1, ...routes.map((route) => Number.isFinite(route.requestsPerSecond) ? route.requestsPerSecond : 0));
  const number = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  return (
    <div ref={root} data-slot="router-flow" className="flex min-w-0 items-stretch gap-3">
      <div ref={canvas} className="relative min-w-0 flex-1">
        <span className="absolute left-0 -translate-y-7 font-mono text-label uppercase tracking-wider text-fg-subtle" style={{ top: center }}>{gateway}</span>
        <svg aria-hidden="true" className="block w-full overflow-visible" height={height} viewBox={`0 0 ${width} ${height}`}>
          {routes.map((route, index) => {
            const y = index * 44 + 22;
            const path = `M 8 ${center} H ${width * 0.2} C ${width * 0.34} ${center} ${width * 0.332} ${y} ${width * 0.46} ${y} H ${width - 6}`;
            const pathId = `${id}-route-${index}`;
            const color = chartSeriesColor(route.id, route);
            const count = Number.isFinite(route.requestsPerSecond) && route.requestsPerSecond > 0
              ? Math.max(3, Math.round(14 * route.requestsPerSecond / maxRate)) : 0;
            return (
              <g key={route.id} fill={color} data-slot="router-flow-route" data-route-id={route.id}
                pointerEvents="none"
                className={cn("transition-opacity duration-fast motion-reduce:transition-none", activeRouteId && activeRouteId !== route.id ? "opacity-40" : "opacity-100")}
                onMouseEnter={() => onHoverRoute?.(route.id)} onMouseLeave={() => onHoverRoute?.(null)}>
                <path id={pathId} d={path} stroke={color} strokeWidth="5" strokeOpacity="0.08" fill="none" vectorEffect="non-scaling-stroke" />
                <path d={path} stroke={color} strokeWidth="2" strokeOpacity="0.3" fill="none" vectorEffect="non-scaling-stroke" />
                {animated && running && Array.from({ length: count }, (_, particle) => (
                  <g key={particle} data-slot="router-particle">
                    {[0, 1, 2].map((trail) => (
                      <circle key={trail} r={trail === 0 ? 2.7 : 1.9} opacity={trail === 0 ? 0.9 : 0.22 / trail}>
                        <animateMotion dur="4s" begin={`${-4 * (particle / count) - index * 0.31 + trail * 0.035}s`} repeatCount="indefinite" calcMode="paced">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                    ))}
                  </g>
                ))}
                <circle cx={width - 6} cy={y} r="4.5" />
                <path d={`M ${width * 0.2} ${center} C ${width * 0.34} ${center} ${width * 0.332} ${y} ${width * 0.46} ${y} H ${width - 6}`}
                  fill="none" stroke="transparent" strokeWidth="16" pointerEvents="stroke" />
              </g>
            );
          })}
          <circle cx="8" cy={center} r="4.5" className="fill-surface-floating stroke-fg-subtle" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="w-40 shrink-0 @sm:w-52">
        {routes.map((route) => (
          <div key={route.id} data-slot="router-flow-label" data-route-id={route.id} role="group" aria-label={route.name} tabIndex={0}
            onMouseEnter={() => onHoverRoute?.(route.id)} onMouseLeave={() => onHoverRoute?.(null)}
            onFocus={() => onFocusRoute?.(route.id)} onBlur={() => onFocusRoute?.(null)}
            className={cn("flex h-11 min-w-0 items-center justify-between gap-2 rounded-md px-1 transition-opacity duration-fast motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-focus-ring",
              activeRouteId && activeRouteId !== route.id ? "opacity-40" : "opacity-100")}>
            <span className="flex min-w-0 items-center gap-2"><ModelLogo route={route} /><span className="truncate text-body text-fg-default" title={route.name}>{route.name}</span></span>
            <span className="shrink-0 font-mono text-label tabular-nums text-fg-subtle">{Number.isFinite(route.requestsPerSecond) && route.requestsPerSecond >= 0 ? number.format(route.requestsPerSecond) : "—"}/s</span>
          </div>
        ))}
      </div>
    </div>
  );
});
