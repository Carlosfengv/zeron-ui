// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageNavigation } from "@zeron/ui/message-navigation";

const items = [
  { id: "first", label: "First question", description: "First response excerpt" },
  { id: "second", label: "Second question", description: "Second response excerpt" },
  { id: "third", label: "Third question" },
];
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("MessageNavigation", () => {
  it("requests bookmark changes while waiting for the host to commit the state", async () => {
    const onBookmarkChange = vi.fn();
    const onSelect = vi.fn();
    const props = { onSelect, onBookmarkChange };
    const { rerender } = render(<MessageNavigation items={items} {...props} />);
    const first = screen.getByRole("button", { name: "First question" });
    act(() => first.focus());
    const bookmark = await screen.findByRole("button", { name: "Bookmark message" });
    expect(bookmark.getAttribute("data-slot")).toBe("button");
    expect(bookmark.getAttribute("aria-pressed")).toBe("false");
    expect(first.hasAttribute("data-bookmarked")).toBe(false);
    fireEvent.click(bookmark);
    expect(onBookmarkChange).toHaveBeenCalledExactlyOnceWith("first", true);
    expect(bookmark.getAttribute("aria-pressed")).toBe("false");
    expect(onSelect).not.toHaveBeenCalled();
    expect(first.hasAttribute("data-bookmarked")).toBe(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(<MessageNavigation items={[{ ...items[0], bookmarked: true }, items[1]]} {...props} />);
    expect(bookmark.getAttribute("aria-pressed")).toBe("true");
    expect(first.hasAttribute("data-bookmarked")).toBe(true);
    expect(document.getElementById(first.getAttribute("aria-describedby")!)?.textContent).toBe("Bookmarked");
    expect(bookmark.querySelector("svg")?.getAttribute("fill")).toBe("currentColor");
    fireEvent.click(bookmark);
    expect(onBookmarkChange).toHaveBeenLastCalledWith("first", false);
    expect(bookmark.getAttribute("aria-pressed")).toBe("true");
    act(() => screen.getByRole("button", { name: "Second question" }).focus());
    const second = await screen.findByRole("button", { name: "Bookmark message" });
    await waitFor(() => expect(second.getAttribute("aria-pressed")).toBe("false"));
    fireEvent.click(second);
    expect(onBookmarkChange).toHaveBeenLastCalledWith("second", true);
    rerender(<MessageNavigation items={items} {...props} />);
    expect(first.hasAttribute("data-bookmarked")).toBe(false);
    expect(first.hasAttribute("aria-describedby")).toBe(false);
  });

  it("identifies externally bookmarked turns in read-only navigation without changing the current location", () => {
    render(<MessageNavigation items={[{ ...items[0], bookmarked: true }, items[1]]}
      activeId="second" onSelect={vi.fn()} bookmarkLabels={{ bookmarked: "已收藏" }} />);
    const first = screen.getByRole("button", { name: "First question" });
    const second = screen.getByRole("button", { name: "Second question" });
    expect(document.getElementById(first.getAttribute("aria-describedby")!)?.textContent).toBe("已收藏");
    expect(first.hasAttribute("aria-current")).toBe(false);
    expect(first.tabIndex).toBe(-1);
    expect(second.getAttribute("aria-current")).toBe("location");
    expect(second.hasAttribute("aria-describedby")).toBe(false);
    expect(second.tabIndex).toBe(0);
  });

  it("hides bookmarks without a callback and supports localized disabled toggles", async () => {
    const onBookmarkChange = vi.fn();
    const data = [{ ...items[0], bookmarked: true, bookmarkDisabled: true }];
    const { rerender } = render(<MessageNavigation items={data} onSelect={vi.fn()} />);
    act(() => screen.getByRole("button", { name: "First question" }).focus());
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Bookmark message" })).toBeNull();
    rerender(<MessageNavigation items={data} onSelect={vi.fn()} onBookmarkChange={onBookmarkChange}
      bookmarkLabels={{ bookmark: "收藏消息", unbookmark: "取消收藏" }} />);
    const bookmark = screen.getByRole("button", { name: "收藏消息" });
    expect((bookmark as HTMLButtonElement).disabled).toBe(true);
    expect(bookmark.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(bookmark);
    expect(onBookmarkChange).not.toHaveBeenCalled();
  });

  it("dismisses the tooltip, then returns focus to the marker when Escape closes the preview", async () => {
    render(<MessageNavigation items={items} onSelect={vi.fn()} onBookmarkChange={vi.fn()} />);
    const first = screen.getByRole("button", { name: "First question" });
    act(() => first.focus());
    const bookmark = await screen.findByRole("button", { name: "Bookmark message" });
    act(() => bookmark.focus());
    await screen.findByRole("tooltip");
    fireEvent.keyDown(bookmark, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    fireEvent.keyDown(bookmark, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(first);
  });

  it("omits empty data and exposes controlled location with localized names", () => {
    const { container, rerender } = render(<MessageNavigation items={[]} onSelect={vi.fn()} />);
    expect(container.innerHTML).toBe("");
    rerender(<MessageNavigation items={items} activeId="second" onSelect={vi.fn()} label="消息"
      getItemLabel={(item, index) => `${index + 1}: ${item.label}`} />);
    const nav = screen.getByRole("navigation", { name: "消息" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons.map((button) => button.tabIndex)).toEqual([-1, 0, -1]);
    expect(buttons[1].getAttribute("aria-current")).toBe("location");
    expect(buttons[0].getAttribute("aria-label")).toBe("1: First question");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("moves one tab stop with arrows, Home and End without selecting", async () => {
    const onSelect = vi.fn();
    render(<MessageNavigation items={items} activeId="first" onSelect={onSelect} />);
    const buttons = within(screen.getByRole("navigation")).getAllByRole("button");
    act(() => buttons[0].focus());
    fireEvent.keyDown(buttons[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons.map((button) => button.tabIndex)).toEqual([-1, 0, -1]);
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByText("Second response excerpt")).toBeTruthy());
    fireEvent.keyDown(buttons[1], { key: "End" });
    expect(document.activeElement).toBe(buttons[2]);
    fireEvent.keyDown(buttons[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(buttons[2]);
    fireEvent.keyDown(buttons[2], { key: "Home" });
    expect(document.activeElement).toBe(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("previews on focus, dismisses with Escape and selects without reopening the popup", async () => {
    const onSelect = vi.fn();
    render(<MessageNavigation items={items} onSelect={onSelect} />);
    const first = screen.getByRole("button", { name: "First question" });
    act(() => first.focus());
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    fireEvent.keyDown(first, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.blur(first);
    fireEvent.focus(first);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    fireEvent.click(first);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("first");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps preview actions separate from selection and updates missing tab stops", async () => {
    const bookmark = vi.fn();
    const select = vi.fn();
    const { rerender } = render(<MessageNavigation items={[{ ...items[0], actions: <button onClick={bookmark}>Bookmark</button> }, items[1]]} onSelect={select} />);
    act(() => screen.getByRole("button", { name: "First question" }).focus());
    fireEvent.click(await screen.findByRole("button", { name: "Bookmark" }));
    expect(bookmark).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    rerender(<MessageNavigation items={[items[1]]} activeId="removed" onSelect={select} />);
    expect(screen.getByRole("button", { name: "Second question" }).tabIndex).toBe(0);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    rerender(<MessageNavigation items={items} activeId="second" onSelect={select} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reveals the active marker by scrolling only its own list", () => {
    const { container, rerender } = render(<MessageNavigation items={items} activeId="first" onSelect={vi.fn()} />);
    const list = container.querySelector('nav > div')!;
    const buttons = within(screen.getByRole("navigation")).getAllByRole("button");
    Object.defineProperty(list, "clientHeight", { configurable: true, value: 24 });
    buttons.forEach((button, index) => {
      Object.defineProperty(button, "offsetTop", { configurable: true, value: index * 12 });
      Object.defineProperty(button, "offsetHeight", { configurable: true, value: 12 });
    });
    const pageScroll = vi.spyOn(window, "scrollTo");
    rerender(<MessageNavigation items={items} activeId="third" onSelect={vi.fn()} />);
    expect(list.scrollTop).toBe(12);
    rerender(<MessageNavigation items={items} activeId="first" onSelect={vi.fn()} />);
    expect(list.scrollTop).toBe(0);
    expect(pageScroll).not.toHaveBeenCalled();
  });
});
