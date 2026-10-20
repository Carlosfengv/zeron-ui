// @vitest-environment jsdom
import { createRef, useRef, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChatAssistantMessage,
  ChatDivider,
  ChatThread,
  ChatUserMessage,
  chatThreadZhLabels,
} from "@zeron/blocks/chat-thread-01";
import { InputMessage } from "@zeron/ui/input-message";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { Toaster, toast } from "@zeron/ui/toast";

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", TestResizeObserver);
Object.defineProperty(HTMLElement.prototype, "getAnimations", {
  configurable: true,
  value: () => [],
});
let touch = false;
beforeEach(() => {
  touch = false;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query === "(pointer: coarse)" ? touch : false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }),
  });
});
afterEach(() => {
  cleanup();
  toast.dismiss();
  vi.restoreAllMocks();
});

describe("ChatThread", () => {
  it("does not load history while a checkpoint restore is pending", async () => {
    let complete!: () => void;
    const onRestore = vi.fn(() => new Promise<void>((resolve) => { complete = resolve; }));
    const onLoadOlder = vi.fn();
    render(<ChatThread composer={<textarea />} hasOlder onLoadOlder={onLoadOlder} onRestore={onRestore}>
      <ChatUserMessage id="q" text="Question" checkpoint={{ id: "cp" }} />
    </ChatThread>);
    const load = screen.getByRole("button", { name: "Load earlier messages" }) as HTMLButtonElement;
    fireEvent.click(screen.getByRole("button", { name: "Restore: Question" }));
    fireEvent.click(await screen.findByRole("button", { name: "Conversation only" }));
    expect(onRestore).toHaveBeenCalledOnce();
    expect(load.disabled).toBe(true);
    fireEvent.click(load);
    expect(onLoadOlder).not.toHaveBeenCalled();
    await act(async () => complete());
    expect(load.disabled).toBe(false);
  });

  it.each([false, true])("freezes checkpoint and edit actions while history is loading externally=%s", async (external) => {
    let complete!: () => void;
    const onLoadOlder = vi.fn(() => new Promise<void>((resolve) => { complete = resolve; }));
    const onRestore = vi.fn();
    const onEdit = vi.fn();
    render(<ChatThread composer={<textarea />} hasOlder loadingOlder={external} onLoadOlder={onLoadOlder} onRestore={onRestore}>
      <ChatUserMessage id="q" text="Question" checkpoint={{ id: "cp" }} onEdit={onEdit} />
    </ChatThread>);
    if (!external) fireEvent.click(screen.getByRole("button", { name: "Load earlier messages" }));
    const restore = screen.getByRole("button", { name: "Restore: Question" }) as HTMLButtonElement;
    const edit = screen.getByRole("button", { name: "Edit message" }) as HTMLButtonElement;
    expect(restore.disabled).toBe(true);
    expect(edit.disabled).toBe(true);
    fireEvent.click(restore);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onRestore).not.toHaveBeenCalled();
    if (!external) {
      await act(async () => complete());
      expect(restore.disabled).toBe(false);
      expect(edit.disabled).toBe(false);
    }
  });

  it.each(["busy", "history"] as const)("retains an open edit draft and blocks saving during %s", async (reason) => {
    const onEdit = vi.fn();
    const view = (blocked: boolean) => <ChatThread composer={<textarea />} busy={blocked && reason === "busy"} loadingOlder={blocked && reason === "history"}>
      <ChatUserMessage id="q" text="Original" onEdit={onEdit} />
    </ChatThread>;
    const { rerender } = render(view(false));
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    const editor = screen.getByRole("textbox", { name: "Edit message" }) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: "Keep this draft" } });
    rerender(view(true));
    expect(editor.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Save and send" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(onEdit).not.toHaveBeenCalled();
    expect(editor.value).toBe("Keep this draft");
    rerender(view(false));
    expect(editor.disabled).toBe(false);
    fireEvent.keyDown(editor, { key: "Enter" });
    await waitFor(() => expect(onEdit).toHaveBeenCalledExactlyOnceWith("Keep this draft"));
  });

  it.each([false, true])("defers an existing undo action while history is loading externally=%s", async (external) => {
    const undo = vi.fn();
    const onRestore = vi.fn(() => ({ undo }));
    let complete!: () => void;
    const onLoadOlder = vi.fn(() => new Promise<void>((resolve) => { complete = resolve; }));
    const view = (loadingOlder: boolean) => <>
      <ChatThread composer={<textarea />} hasOlder loadingOlder={loadingOlder} onLoadOlder={onLoadOlder} onRestore={onRestore}>
        <ChatUserMessage id="q" text="Question" checkpoint={{ id: "cp" }} />
      </ChatThread>
      <Toaster />
    </>;
    const { rerender } = render(view(false));
    fireEvent.click(screen.getByRole("button", { name: "Restore: Question" }));
    fireEvent.click(await screen.findByRole("button", { name: "Conversation only" }));
    const action = await screen.findByRole("button", { name: "Undo" });
    if (external) rerender(view(true));
    else fireEvent.click(screen.getByRole("button", { name: "Load earlier messages" }));
    fireEvent.click(action);
    expect(undo).not.toHaveBeenCalled();
    if (external) rerender(view(false));
    else await act(async () => complete());
    fireEvent.click(action);
    await waitFor(() => expect(undo).toHaveBeenCalledOnce());
  });

  it("forwards controlled bookmarks using logical user-message IDs", async () => {
    const onBookmarkChange = vi.fn();
    const props = { composer: <textarea />, onBookmarkChange,
      bookmarkLabels: { bookmark: "收藏消息", unbookmark: "取消收藏" } };
    const messages = <><ChatUserMessage id="user-stable" text="A question" />
      <ChatAssistantMessage id="reply" text="An answer" /></>;
    const { rerender } = render(<ChatThread {...props} bookmarkedIds={["user-stable"]}>{messages}</ChatThread>);
    const marker = within(screen.getByRole("navigation")).getByRole("button");
    act(() => marker.focus());
    const bookmark = await screen.findByRole("button", { name: "收藏消息" });
    expect(bookmark.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(bookmark);
    expect(onBookmarkChange).toHaveBeenCalledExactlyOnceWith("user-stable", false);
    expect(bookmark.getAttribute("aria-pressed")).toBe("true");
    rerender(<ChatThread {...props} bookmarkedIds={[]}>{messages}</ChatThread>);
    expect(bookmark.getAttribute("aria-pressed")).toBe("false");
  });
  it("previews the response belonging to a user turn and focuses that turn when selected", async () => {
    render(<ChatThread composer={<textarea />}>
      <ChatUserMessage id="u1" text="First question" />
      <ChatAssistantMessage id="a1" text={"First **answer**\n\nMore details"} />
      <ChatUserMessage id="u2" text="Second question" />
      <ChatAssistantMessage id="a2" text="Second answer" />
    </ChatThread>);
    const nav = screen.getByRole("navigation", { name: "Messages" });
    const marker = within(nav).getByRole("button", { name: "Message 1: First question" });
    act(() => marker.focus());
    const preview = await screen.findByRole("dialog");
    expect(within(preview).getByText("answer").tagName).toBe("STRONG");
    expect(within(preview).queryByText("Second answer")).toBeNull();
    expect(within(preview).queryByText("More details")).toBeNull();
    fireEvent.click(marker);
    expect(document.activeElement?.getAttribute("data-thread-message")).toBe("u1");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps reply identity above streamed content and omits it from the metrics row", () => {
    const reply = { id: "a1", model: "Response model", modelLogo: <svg data-testid="response-logo" />, provider: "Response provider" };
    const { rerender } = render(
      <ChatThread composer={<textarea />}>
        <ChatAssistantMessage {...reply} text="Partial" streaming metrics={{ ttftMs: 420 }} />
      </ChatThread>,
    );
    const author = screen.getByText(reply.model).closest('[data-slot="chat-message-author"]')!;
    expect(author.contains(screen.getByText(reply.provider))).toBe(true);
    expect(author.contains(screen.getByTestId("response-logo"))).toBe(true);
    expect(screen.queryByText("TTFT 420 ms")).toBeNull();
    rerender(
      <ChatThread composer={<textarea />}>
        <ChatAssistantMessage {...reply} text="Complete" last meta="Custom metadata" metrics={{ ttftMs: 420, inputTokens: 1248 }} />
      </ChatThread>,
    );
    const footer = screen.getByText("TTFT 420 ms").closest('[data-slot="chat-message-footer"]')!;
    expect(footer.textContent).not.toContain(reply.model);
    expect(footer.textContent).not.toContain(reply.provider);
    expect(footer.contains(screen.getByText("Custom metadata"))).toBe(true);
    expect(screen.getAllByText(reply.model)).toHaveLength(1);
    expect(screen.getByText(reply.model).closest('[data-slot="chat-message-author"]')).toBe(author);
  });

  it("composes shared separators, notices, footer and navigation controls", () => {
    const props = { composer: <textarea />, onRestore: vi.fn() };
    const { container, rerender } = render(
      <ChatThread {...props}>
        <ChatDivider>Today</ChatDivider>
        <ChatUserMessage id="u1" text="Question" checkpoint={{ id: "cp" }} />
        <ChatAssistantMessage id="a1" text="Partial reply" error="Connection lost" model="Response model" onRetry={vi.fn()} />
      </ChatThread>,
    );
    expect(container.querySelectorAll('[data-slot="separator"][aria-hidden="true"]')).toHaveLength(4);
    expect(screen.getByRole("alert").getAttribute("data-slot")).toBe("inline-notice");
    expect(screen.getByText("Response model").closest('[data-slot="chat-message-author"]')).toBeTruthy();
    const navigation = screen.getByRole("navigation", { name: "Messages" });
    expect(navigation.getAttribute("data-slot")).toBe("message-navigation");
    expect(navigation.querySelector("button")?.getAttribute("data-slot")).toBe("message-navigation-item");
    rerender(
      <ChatThread {...props}>
        <ChatAssistantMessage id="a1" text="Partial reply" stopped />
      </ChatThread>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
    const stopped = screen.getByText("Response stopped").closest('[data-slot="inline-notice"]');
    expect(stopped).toBeTruthy();
    expect(stopped?.getAttribute("role")).toBeNull();
  });

  it("restores editor focus when the confirmed checkpoint unmounts with removed messages", async () => {
    function Host() {
      const [visible, setVisible] = useState(true);
      const editor = useRef<HTMLTextAreaElement>(null);
      return (
        <ChatThread
          composerRef={editor}
          composer={<textarea ref={editor} defaultValue="Recovered question" />}
          onRestore={() => setVisible(false)}
        >
          {visible && (
            <ChatUserMessage
              id="u1"
              text="Recovered question"
              checkpoint={{ id: "cp" }}
            />
          )}
        </ChatThread>
      );
    }
    render(<Host />);
    fireEvent.click(
      screen.getByRole("button", { name: "Restore: Recovered question" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Conversation only" }),
    );
    await waitFor(() =>
      expect(document.querySelector("[data-thread-message]")).toBeNull(),
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("textbox")),
    );
  });
  it("keeps the composer, selection, focus and draft when the first message appears", () => {
    const editor = createRef<HTMLTextAreaElement>();
    const composer = (
      <InputMessage
        value="Keep this draft"
        onValueChange={vi.fn()}
        textareaRef={editor}
      />
    );
    const { rerender } = render(<ChatThread composer={composer} />);
    expect(screen.getByRole("heading").closest('[data-slot="empty"]')).toBeTruthy();
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(4, 4);
    rerender(
      <ChatThread composer={composer}>
        <ChatUserMessage id="u1" text="Hello" />
      </ChatThread>,
    );
    expect(screen.getByRole("textbox")).toBe(textarea);
    expect(editor.current).toBe(textarea);
    expect(document.activeElement).toBe(textarea);
    expect(textarea.value).toBe("Keep this draft");
    expect(textarea.selectionStart).toBe(4);
  });

  it("does not submit edits during IME composition and restores focus on cancel", async () => {
    const onEdit = vi.fn();
    render(
      <ChatThread composer={<textarea />}>
        <ChatUserMessage id="u1" text="Original" onEdit={onEdit} />
      </ChatThread>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    const editor = screen.getByRole("textbox", { name: "Edit message" });
    fireEvent.change(editor, { target: { value: "新的问题" } });
    fireEvent.keyDown(editor, { key: "Enter", isComposing: true });
    expect(onEdit).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "Enter", shiftKey: true });
    expect(onEdit).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "Escape" });
    await waitFor(() =>
      expect(document.activeElement?.getAttribute("data-thread-message")).toBe(
        "u1",
      ),
    );
  });

  it("retains an edit draft after failure, then commits the new text on retry", async () => {
    const onEdit = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    render(
      <ChatThread composer={<textarea />}>
        <ChatUserMessage id="u1" text="Original" onEdit={onEdit} />
      </ChatThread>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit message" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit message" }), {
      target: { value: "Updated" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Edit message" }), {
      key: "Enter",
    });
    expect((await screen.findByRole("alert")).getAttribute("data-slot")).toBe("inline-notice");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Edit message",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Updated");
    fireEvent.click(screen.getByRole("button", { name: "Save and send" }));
    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(2));
    expect(onEdit).toHaveBeenLastCalledWith("Updated");
  });

  it("uses controlled feedback, disables history actions while busy and hides streaming actions", () => {
    const feedback = vi.fn();
    const retry = vi.fn();
    const { rerender } = render(
      <ChatThread composer={<textarea />}>
        <ChatAssistantMessage
          id="a1"
          text="Answer"
          feedback="up"
          onFeedback={feedback}
          onRetry={retry}
          last
        />
      </ChatThread>,
    );
    const good = screen.getByRole("button", { name: "Good response" });
    expect(good.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(good);
    expect(feedback).toHaveBeenCalledExactlyOnceWith(null);
    rerender(
      <ChatThread busy composer={<textarea />}>
        <ChatAssistantMessage
          id="a1"
          text="Partial"
          streaming
          onRetry={retry}
        />
      </ChatThread>,
    );
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByRole("log").getAttribute("aria-busy")).toBe("true");
  });

  it("keeps a failed restore open, forwards the code choice, and focuses the composer after success", async () => {
    const onRestore = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ undo: vi.fn() });
    function Fixture() {
      const editor = useRef<HTMLTextAreaElement>(null);
      return (
        <>
          <ChatThread
            composerRef={editor}
            onRestore={onRestore}
            composer={<textarea ref={editor} defaultValue="Restored draft" />}
          >
            <ChatUserMessage
              id="u1"
              text="Change the file"
              checkpoint={{ id: "cp1", files: ["one.ts"] }}
            />
            <ChatAssistantMessage id="a1" text="Done" />
          </ChatThread>
          <Toaster />
        </>
      );
    }
    render(<Fixture />);
    fireEvent.click(
      screen.getByRole("button", { name: "Restore: Change the file" }),
    );
    expect(
      await screen.findByText(
        "Removes this message and 1 later messages, and reverts 1 file.",
      ),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Restore conversation and code" }),
    );
    expect(
      await screen.findByText("Could not restore the checkpoint. Try again."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Conversation only" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Conversation only" }));
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(2));
    expect(onRestore).toHaveBeenLastCalledWith("cp1", { code: false });
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("textbox")),
    );
    expect((document.activeElement as HTMLTextAreaElement).selectionStart).toBe(
      "Restored draft".length,
    );
    expect(await screen.findByRole("button", { name: "Undo" })).toBeTruthy();
  });

  it("shows retryable load failure and uses localized action labels", async () => {
    const load = vi.fn().mockRejectedValue(new Error("offline"));
    render(
      <ChatThread
        labels={chatThreadZhLabels}
        hasOlder
        onLoadOlder={load}
        composer={<textarea />}
      >
        <ChatUserMessage id="u1" text="问题" />
      </ChatThread>,
    );
    fireEvent.click(screen.getByRole("button", { name: "加载更早的消息" }));
    expect((await screen.findByRole("alert")).getAttribute("data-slot")).toBe("inline-notice");
    expect(load).toHaveBeenCalledOnce();
    expect(
      (
        screen.getByRole("button", {
          name: "加载更早的消息",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});

describe("shared chat component compatibility", () => {
  it("freezes automatic queue release for history mutations and retains the legacy default", () => {
    const onSend = vi.fn();
    const props = {
      value: "",
      onValueChange: vi.fn(),
      queue: [{ id: "queued", text: "Next", files: [] }],
      onQueueChange: vi.fn(),
      onSend,
    };
    const { rerender } = render(
      <InputMessage {...props} status="streaming" autoDispatchQueue={false} />,
    );
    rerender(
      <InputMessage {...props} status="idle" autoDispatchQueue={false} />,
    );
    expect(onSend).not.toHaveBeenCalled();
    rerender(<InputMessage {...props} status="idle" />);
    expect(onSend).not.toHaveBeenCalled();
    rerender(<InputMessage {...props} status="streaming" />);
    rerender(<InputMessage {...props} status="idle" />);
    expect(onSend).toHaveBeenCalledExactlyOnceWith("Next", [], {
      queuedId: "queued",
    });
  });

  it.each([false, true])(
    "exposes the real scrolling viewport on touch=%s",
    async (coarse) => {
      touch = coarse;
      const viewport = createRef<HTMLDivElement>();
      const onScroll = vi.fn();
      render(
        <ScrollArea
          viewportRef={viewport}
          viewportProps={{ "aria-label": "Transcript", onScroll }}
        >
          <p>Content</p>
        </ScrollArea>,
      );
      await waitFor(() =>
        expect(viewport.current?.getAttribute("data-slot")).toBe(
          "scroll-area-viewport",
        ),
      );
      expect(viewport.current?.getAttribute("aria-label")).toBe("Transcript");
      await act(async () => {
        fireEvent.scroll(viewport.current!);
      });
      expect(onScroll).toHaveBeenCalled();
    },
  );
});
