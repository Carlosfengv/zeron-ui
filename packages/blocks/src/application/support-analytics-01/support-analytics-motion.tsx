"use client";

import { useId, useLayoutEffect, useRef, useSyncExternalStore, type FocusEvent } from "react";
import { animate, motion, MotionConfig } from "framer-motion";
import { Badge } from "@zeron/ui/badge";
import { spring } from "@zeron/ui/system/springs";
import { formatCount, validCount } from "./support-analytics-data";
import type { SupportAnalyticsChannel, SupportAnalyticsLabels } from "./support-analytics-types";

const channels: SupportAnalyticsChannel[] = ["all", "email", "live-chat", "in-app", "social"];
const highlight = { base: "var(--brand)", onStrong: "var(--fg-on-brand)" };
const selectedText = { ...highlight, softBackground: "var(--muted)", onSoft: "var(--fg-on-brand)" };
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotionPreference(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getMotionPreference() { return window.matchMedia(motionQuery).matches; }
function getServerMotionPreference() { return true; }
function useReducedMotion() {
  return useSyncExternalStore(subscribeMotionPreference, getMotionPreference, getServerMotionPreference);
}

export function SupportTotal({ value, locale }: { value: number | null; locale: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const displayed = useRef<number | null>(validCount(value) ? value : null);
  const reducedMotion = useReducedMotion();
  useLayoutEffect(() => {
    const target = element.current;
    if (!target) return;
    if (!validCount(value) || reducedMotion || displayed.current === null || displayed.current === value) {
      displayed.current = validCount(value) ? value : null;
      target.textContent = formatCount(value, locale);
      return;
    }
    // Retarget from the currently displayed value, including an interrupted transition.
    const formatter = new Intl.NumberFormat(locale);
    target.textContent = formatter.format(Math.round(displayed.current));
    const controls = animate(displayed.current, value, {
      ...spring.slow,
      duration: spring.slow.duration * 2,
      bounce: 0,
      onUpdate: (next) => {
        displayed.current = next;
        target.textContent = formatter.format(Math.round(next));
      },
      onComplete: () => {
        displayed.current = value;
        target.textContent = formatter.format(value);
      },
    });
    return () => controls.stop();
  }, [value, locale, reducedMotion]);
  return <span><span ref={element} aria-hidden="true">{formatCount(value, locale)}</span><span className="sr-only">{formatCount(value, locale)}</span></span>;
}

export function SupportChannelBadges({ channel, labels, onChange, onFocus }: {
  channel: SupportAnalyticsChannel;
  labels: SupportAnalyticsLabels;
  onChange: (channel: SupportAnalyticsChannel) => void;
  onFocus: (event: FocusEvent<HTMLDivElement>) => void;
}) {
  const indicatorId = useId();
  const reducedMotion = useReducedMotion();
  // Own the live preference below; the projection engine otherwise freezes its
  // reduced-motion setting when it first mounts during hydration.
  return <MotionConfig reducedMotion="never">
    <motion.div layoutScroll className="overflow-x-auto" onFocus={onFocus}>
      <div role="group" aria-label={labels.channels} className="relative isolate flex min-w-max items-center gap-2 p-1">
        {channels.map((item) => {
          const indicator = <Badge variant="strong" color={highlight} className="h-full w-full"><span className="invisible">{labels[item]}</span></Badge>;
          return <div key={item} className="relative shrink-0">
          {channel === item && (reducedMotion
            ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">{indicator}</div>
            : <motion.div layoutId={indicatorId} initial={false} transition={spring.moderate} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">{indicator}</motion.div>)}
          <Badge color={channel === item ? selectedText : "gray"} role="button" tabIndex={0} aria-pressed={channel === item}
            className="cursor-pointer outline-none transition-colors duration-fast ease-out motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={() => onChange(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!event.repeat) onChange(item); } }}>
            <span className="relative z-20">{labels[item]}</span>
          </Badge>
        </div>;
        })}
      </div>
    </motion.div>
  </MotionConfig>;
}
