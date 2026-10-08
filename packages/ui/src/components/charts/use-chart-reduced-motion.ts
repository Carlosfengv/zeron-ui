"use client";
import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function getSnapshot() { return window.matchMedia(query).matches; }
function getServerSnapshot() { return false; }

/** Hydrate the same entrance markup as SSR, then apply the visitor preference. */
export function useChartReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
