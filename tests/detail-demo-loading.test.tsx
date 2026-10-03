// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DeferredDetailDemo } from "../docs/components/content/DeferredDetailDemo";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@zeron/ui/button", () => ({ Button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button> }));
let intersect: IntersectionObserverCallback;
const disconnect = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; }
    observe() {}
    disconnect = disconnect;
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function Demo({ label }: { label: string }) {
  const [value, setValue] = useState(0);
  return <button onClick={() => setValue(value + 1)}>{label} {value}</button>;
}

it("loads the primary demo automatically and reserves its space", async () => {
  const loader = vi.fn(async () => Demo);
  const view = render(<DeferredDetailDemo loader={loader} demoProps={{ label: "Edit" }} minHeight={392} />);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(view.container.firstElementChild?.getAttribute("style")).toBe("min-height: 392px;");
  expect(await screen.findByRole("button", { name: "Edit 0" })).toBeTruthy();
  expect(view.container.firstElementChild?.getAttribute("style")).toBe("min-height: 392px;");
});

it("defers secondary imports until near the viewport and never discards edits on scroll", async () => {
  const loader = vi.fn(async () => Demo);
  render(<DeferredDetailDemo loader={loader} demoProps={{ label: "Edit" }} minHeight={360} nearViewport />);
  expect(loader).not.toHaveBeenCalled();
  await act(async () => intersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  fireEvent.click(await screen.findByRole("button", { name: "Edit 0" }));
  await act(async () => intersect([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(screen.getByRole("button", { name: "Edit 1" })).toBeTruthy();
  expect(loader).toHaveBeenCalledTimes(1);
  expect(disconnect).toHaveBeenCalled();
});

it("loads secondary content without IntersectionObserver support", async () => {
  Reflect.deleteProperty(window, "IntersectionObserver");
  const loader = vi.fn(async () => Demo);
  render(<DeferredDetailDemo loader={loader} demoProps={{ label: "Edit" }} minHeight={360} nearViewport />);
  expect(await screen.findByRole("button", { name: "Edit 0" })).toBeTruthy();
});

it("offers retry after an import failure", async () => {
  const loader = vi.fn<() => Promise<typeof Demo>>().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(Demo);
  render(<DeferredDetailDemo loader={loader} demoProps={{ label: "Edit" }} minHeight={360} />);
  fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("button", { name: "Edit 0" })).toBeTruthy();
  expect(loader).toHaveBeenCalledTimes(2);
});

it("does not mount a completed import after navigation unmounts its placeholder", async () => {
  let resolve!: (component: typeof Demo) => void;
  const loader = () => new Promise<typeof Demo>((done) => { resolve = done; });
  const view = render(<DeferredDetailDemo loader={loader} demoProps={{ label: "Edit" }} minHeight={360} />);
  view.unmount();
  await act(async () => resolve(Demo));
  expect(screen.queryByRole("button", { name: "Edit 0" })).toBeNull();
});
