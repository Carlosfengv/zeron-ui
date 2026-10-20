// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMarkdownDemo } from "../docs/components/blocks/ChatMarkdownDemo";

vi.mock("next-intl", () => ({ useLocale: () => "zh-CN" }));
vi.mock("#components/code-block", () => ({
  CodeBlock: ({ file }: { file: { contents: string } }) => <pre>{file.contents}</pre>,
}));

let resize: () => void;
let disconnect: ReturnType<typeof vi.fn>;
beforeEach(() => {
  disconnect = vi.fn();
  const observers: { callback: () => void; targets: Element[] }[] = [];
  resize = () => observers.filter((observer) => observer.targets.some((target) => target.getAttribute("aria-label") === "Markdown 回复")).forEach((observer) => observer.callback());
  vi.stubGlobal("ResizeObserver", class {
    targets: Element[] = [];
    constructor(callback: () => void) { observers.push({ callback, targets: this.targets }); }
    observe(target: Element) { this.targets.push(target); } unobserve() {} disconnect = disconnect;
  });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: function (this: HTMLElement, options: ScrollToOptions) {
    this.scrollTop = options.top ?? 0;
  } });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Chat Markdown demo", () => {
  it("tracks late layout changes while following and preserves a paused reader position", () => {
    render(<ChatMarkdownDemo />);
    const viewport = screen.getByRole("region", { name: "Markdown 回复" });
    let height = 1000;
    let top = 0;
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, get: () => height },
      clientHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, get: () => top, set: (value: number) => { top = Math.max(0, Math.min(value, height - 400)); } },
    });
    fireEvent.scroll(viewport);
    fireEvent.click(screen.getByRole("button", { name: "回到最新内容" }));
    expect(top).toBe(600);
    expect(document.activeElement).toBe(viewport);
    height = 1400;
    act(() => resize());
    expect(top).toBe(1000);
    expect(screen.queryByRole("button", { name: "回到最新内容" })).toBeNull();

    viewport.scrollTop = 200;
    fireEvent.scroll(viewport);
    height = 1800;
    act(() => resize());
    expect(top).toBe(200);
    expect(screen.getByRole("button", { name: "回到最新内容" })).not.toBeNull();

    height = 300;
    viewport.scrollTop = 0;
    act(() => resize());
    expect(screen.queryByRole("button", { name: "回到最新内容" })).toBeNull();
  });

  it("stops and replays local content, derives completion and cleans up its timer and observer", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<ChatMarkdownDemo />);
    const original = container.querySelector('[data-slot="markdown"]')!.textContent;
    fireEvent.click(screen.getByRole("button", { name: "重播生成" }));
    act(() => vi.advanceTimersByTime(72));
    fireEvent.click(screen.getByRole("button", { name: "停止" }));
    const partial = container.querySelector('[data-slot="markdown"]')!.textContent;
    expect(partial!.length).toBeGreaterThan(0);
    expect(partial!.length).toBeLessThan(original!.length);
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector('[data-slot="markdown"]')!.textContent).toBe(partial);
    fireEvent.click(screen.getByRole("button", { name: "显示全文" }));
    expect(container.querySelector('[data-slot="markdown"]')!.textContent).toBe(original);
    fireEvent.click(screen.getByRole("button", { name: "重播生成" }));
    act(() => vi.advanceTimersByTime(10000));
    expect(container.querySelector("article")?.getAttribute("aria-busy")).toBe("false");
    expect(screen.queryByRole("button", { name: "停止" })).toBeNull();
    expect(container.querySelector('[data-slot="markdown"]')!.textContent).toBe(original);
    fireEvent.click(screen.getByRole("button", { name: "重播生成" }));
    unmount();
    expect(disconnect).toHaveBeenCalled();
    act(() => vi.runOnlyPendingTimers());
    expect(vi.getTimerCount()).toBe(0);
  });
});
