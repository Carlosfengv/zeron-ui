// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAT_SCROLL_FOLLOW_THRESHOLD } from "@zeron/ui/chat-message";
import { ChatAssistantMessage, ChatThread, ChatUserMessage, chatThreadZhLabels } from "@zeron/blocks/chat-thread-01";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setViewportSize(viewport: HTMLElement, height = 1000) {
  Object.defineProperty(viewport, "scrollHeight", { configurable: true, value: height });
  Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 400 });
}

describe("shared latest-content navigation", () => {
  it.each(["pointer", "touch", "keyboard"])("keeps following after a %s interaction that does not scroll the transcript", async (input) => {
    const view = (text: string) => <ChatThread composer={<textarea />}>
      <ChatUserMessage id="q" text="Question" />
      <ChatAssistantMessage id="a" text={text}>
        {text}<button type="button" onKeyDown={(event) => event.preventDefault()}>Inspect block</button>
      </ChatAssistantMessage>
    </ChatThread>;
    const { rerender } = render(view("Partial"));
    const viewport = screen.getByRole("region", { name: "Conversation" });
    setViewportSize(viewport);
    viewport.scrollTop = 600;
    fireEvent.scroll(viewport);
    const control = screen.getByRole("button", { name: "Inspect block" });
    if (input === "pointer") fireEvent.pointerDown(control);
    else if (input === "touch") fireEvent.touchStart(control);
    else fireEvent.keyDown(control, { key: "ArrowDown" });
    expect(screen.queryByRole("button", { name: "Scroll to latest" })).toBeNull();
    setViewportSize(viewport, 1200);
    await act(async () => rerender(view("A longer streamed reply")));
    expect(viewport.scrollTop).toBe(1200);
  });

  it("pauses on actual history scrolling and resumes when native scrolling reaches the bottom", async () => {
    const view = (text: string) => <ChatThread composer={<textarea />}>
      <ChatUserMessage id="q" text="Question" /><ChatAssistantMessage id="a" text={text} />
    </ChatThread>;
    const { rerender } = render(view("Partial"));
    const viewport = screen.getByRole("region", { name: "Conversation" });
    setViewportSize(viewport);
    viewport.scrollTop = 300;
    fireEvent.scroll(viewport);
    expect(screen.getByRole("button", { name: "Scroll to latest" })).toBeTruthy();
    setViewportSize(viewport, 1200);
    await act(async () => rerender(view("A longer streamed reply")));
    expect(viewport.scrollTop).toBe(300);
    viewport.scrollTop = 800;
    fireEvent.scroll(viewport);
    expect(screen.queryByRole("button", { name: "Scroll to latest" })).toBeNull();
    setViewportSize(viewport, 1400);
    await act(async () => rerender(view("Finished reply")));
    expect(viewport.scrollTop).toBe(1400);
  });


  it("keeps the Thread control hidden at the bottom, then returns from history and resumes following", async () => {
    const messages = <><ChatUserMessage id="q" text="Question" /><ChatAssistantMessage id="a" text="Reply" /></>;
    const { rerender } = render(<ChatThread labels={chatThreadZhLabels} composer={<textarea aria-label="Composer" />}>{messages}</ChatThread>);
    const viewport = screen.getByRole("region", { name: "对话" });
    setViewportSize(viewport);
    viewport.scrollTop = 600;
    fireEvent.pointerDown(viewport);
    expect(screen.queryByRole("button", { name: "回到最新内容" })).toBeNull();
    viewport.scrollTop = 300;
    fireEvent.scroll(viewport);
    fireEvent.click(screen.getByRole("button", { name: "回到最新内容" }));
    expect(viewport.scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "回到最新内容" })).toBeNull();
    setViewportSize(viewport, 1200);
    await act(async () => rerender(<ChatThread labels={chatThreadZhLabels} composer={<textarea aria-label="Composer" />}>{messages}<ChatAssistantMessage id="next" text="More streamed content" /></ChatThread>));
    expect(viewport.scrollTop).toBe(1200);
  });

  it("uses the shared latest-position threshold in Thread", () => {
    const { container } = render(<ChatThread composer={<textarea />}><ChatUserMessage id="q" text="Question" /></ChatThread>);
    const thread = screen.getByRole("region", { name: "Conversation" });
    setViewportSize(thread);
    fireEvent.wheel(thread, { deltaY: -1 });
    thread.scrollTop = 600 - CHAT_SCROLL_FOLLOW_THRESHOLD;
    fireEvent.scroll(thread);
    expect(container.querySelector('[data-slot="chat-scroll-to-latest"]')).not.toBeNull();
    thread.scrollTop += 1;
    fireEvent.scroll(thread);
    expect(screen.queryByRole("button", { name: "Scroll to latest" })).toBeNull();
  });
});
