// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimatedYDomains, type UseAnimatedYDomainsOptions } from "../packages/ui/src/components/charts/use-animated-y-domains";

const motionState = vi.hoisted(() => ({
  reduced: false,
  animations: [] as { onUpdate: (value: number) => void; onComplete: () => void; stop: ReturnType<typeof vi.fn> }[],
}));
vi.mock("motion/react", async importOriginal => ({
  ...await importOriginal<typeof import("motion/react")>(),
  useReducedMotion: () => motionState.reduced,
  animate: (_from: number, _to: number, options: { onUpdate: (value: number) => void; onComplete: () => void }) => {
    const control = { ...options, stop: vi.fn() };
    motionState.animations.push(control);
    return control;
  },
}));
beforeEach(() => { motionState.reduced = false; motionState.animations.length = 0; });
afterEach(cleanup);

const initial: UseAnimatedYDomainsOptions = {
  enabled: true,
  durationMs: 500,
  chartPhase: "ready",
  skeletonByAxis: { left: [0, 100] },
  targetByAxis: { left: [0, 100] },
  tweenOnTargetChange: true,
};

function liveTween() {
  const result = renderHook(props => useAnimatedYDomains(props), { initialProps: initial });
  const next: UseAnimatedYDomainsOptions = { ...initial, targetByAxis: { left: [0, 300] } };
  result.rerender(next);
  act(() => motionState.animations.at(-1)!.onUpdate(0.5));
  expect(result.result.current.left).toEqual([0, 200]);
  return { ...result, next };
}

describe("Y-domain animation lifecycle", () => {
  it("settles at the target if animation is disabled during a live tween", () => {
    const { result, rerender, next } = liveTween();
    const control = motionState.animations.at(-1)!;
    rerender({ ...next, enabled: false });
    expect(control.stop).toHaveBeenCalledOnce();
    expect(result.current.left).toEqual([0, 300]);
  });

  it("settles immediately when reduced motion becomes active during a live tween", () => {
    const { result, rerender, next } = liveTween();
    const control = motionState.animations.at(-1)!;
    motionState.reduced = true;
    rerender({ ...next });
    expect(control.stop).toHaveBeenCalledOnce();
    expect(result.current.left).toEqual([0, 300]);
  });

  it("continues an interrupted loading transition from its current domain when duration changes", () => {
    const onSettled = vi.fn();
    const options: UseAnimatedYDomainsOptions = { ...initial, chartPhase: "loading", targetByAxis: { left: [0, 300] }, onSettled };
    const { result, rerender } = renderHook(props => useAnimatedYDomains(props), { initialProps: options });
    const next: UseAnimatedYDomainsOptions = { ...options, chartPhase: "gridTweenReady" };
    rerender(next);
    const first = motionState.animations.at(-1)!;
    act(() => first.onUpdate(0.5));
    rerender({ ...next, durationMs: 250 });
    expect(first.stop).toHaveBeenCalledOnce();
    expect(motionState.animations).toHaveLength(2);
    act(() => motionState.animations.at(-1)!.onUpdate(0.5));
    expect(result.current.left).toEqual([0, 250]);
    act(() => motionState.animations.at(-1)!.onComplete());
    expect(result.current.left).toEqual([0, 300]);
    expect(onSettled).toHaveBeenCalledOnce();
  });

  it("updates the skeleton domain while remaining in the loading phase", () => {
    const options: UseAnimatedYDomainsOptions = { ...initial, chartPhase: "loading" };
    const { result, rerender } = renderHook(props => useAnimatedYDomains(props), { initialProps: options });
    rerender({ ...options, skeletonByAxis: { left: [0, 500] } });
    expect(result.current.left).toEqual([0, 500]);
    expect(motionState.animations).toHaveLength(0);
  });

  it("stops an in-flight tween on unmount", () => {
    const { unmount } = liveTween();
    const control = motionState.animations.at(-1)!;
    unmount();
    expect(control.stop).toHaveBeenCalledOnce();
  });
});
