// @vitest-environment jsdom

import { useRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  useProximityHover,
  useRegisterProximityItem,
} from "../packages/ui/src/hooks/use-proximity-hover";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Item({ registerItem }: {
  registerItem: ReturnType<typeof useProximityHover>["registerItem"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterProximityItem(registerItem, 0, ref);
  return <div ref={ref}>Item</div>;
}

function List({ showItem = true }: { showItem?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerItem } = useProximityHover(ref);
  return <div ref={ref}>{showItem && <Item registerItem={registerItem} />}</div>;
}

function stubFrames() {
  const frames = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = ++nextId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  return frames;
}

it("does not leave animation frames queued after a list unmounts", () => {
  const frames = stubFrames();
  const { unmount } = render(<List />);
  expect(frames.size).toBeGreaterThan(0);

  unmount();

  expect(frames.size).toBe(0);
});

it("remeasures when an item is removed from a mounted list", () => {
  const frames = stubFrames();
  const { rerender } = render(<List />);
  frames.clear();

  rerender(<List showItem={false} />);

  expect(frames.size).toBeGreaterThan(0);
});
