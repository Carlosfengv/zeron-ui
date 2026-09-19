// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BlockPreview } from "../docs/components/blocks/BlockPreview";

const { mount, unmount } = vi.hoisted(() => ({ mount: vi.fn(), unmount: vi.fn() }));

vi.mock("@zeron/blocks/login-01", async () => {
  const { useEffect } = await import("react");
  return {
    Login01: function PreviewDemo() {
      useEffect(() => {
        mount();
        return unmount;
      }, []);
      return <div>Live preview</div>;
    },
  };
});

let onIntersection: IntersectionObserverCallback;
const disconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { onIntersection = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function setVisible(isIntersecting: boolean) {
  await act(async () => {
    onIntersection([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

it("only runs a demo while its thumbnail is visible, and restores it on return", async () => {
  const view = render(<BlockPreview name="login-01" />);
  expect(mount).not.toHaveBeenCalled();

  await setVisible(true);
  expect(await screen.findByText("Live preview")).toBeTruthy();
  expect(mount).toHaveBeenCalledTimes(1);

  await setVisible(false);
  expect(screen.queryByText("Live preview")).toBeNull();
  expect(unmount).toHaveBeenCalledTimes(1);

  await setVisible(true);
  expect(await screen.findByText("Live preview")).toBeTruthy();
  expect(mount).toHaveBeenCalledTimes(2);

  view.unmount();
  expect(unmount).toHaveBeenCalledTimes(2);
  expect(disconnect).toHaveBeenCalledTimes(1);
});

it("still displays previews when IntersectionObserver is unavailable", async () => {
  // The fallback checks browser support with the `in` operator.
  Reflect.deleteProperty(window, "IntersectionObserver");
  render(<BlockPreview name="login-01" />);
  expect(await screen.findByText("Live preview")).toBeTruthy();
});
