// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as shared from "@zeron/ui/chat-thread";
import * as legacy from "@zeron/blocks/chat-thread-01";
import { ChatMessageAction } from "@zeron/ui/chat-message";
import { ThreadContext as SharedContext } from "@zeron/ui/chat-thread/context";
import { ThreadContext as LegacyContext } from "../packages/blocks/src/application/chat-thread-01/chat-thread-context";
import { splitThreadHistory as historyEntry } from "@zeron/ui/chat-thread/history";
import { chatThreadZhLabels as labelsEntry } from "@zeron/ui/chat-thread/labels";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("ChatThread component compatibility", () => {
  it("preserves every shared export and the original demo-only helpers", () => {
    for (const name of ["ChatThread", "ChatAction", "ChatAssistantMessage", "ChatAttachments", "ChatBranchSwitch", "ChatCheckpoint", "ChatCopy", "ChatDivider", "ChatEditor", "ChatUserMessage", "ChatMarkdown", "chatThreadEnLabels", "chatThreadZhLabels", "splitThreadHistory"] as const) {
      expect(legacy[name]).toBe(shared[name]);
    }
    expect(shared.ChatAction).toBe(ChatMessageAction);
    expect(SharedContext).toBe(LegacyContext);
    expect(labelsEntry).toBe(shared.chatThreadZhLabels);
    expect(historyEntry).toBe(shared.splitThreadHistory);
    expect(legacy.createChatThreadDemoData().messages.length).toBeGreaterThan(0);
    expect(typeof legacy.createChatThreadDemoReply).toBe("function");
    expect(typeof legacy.getChatThreadDemoPath).toBe("function");
    const oldProps: legacy.ChatThreadProps = { composer: <textarea />, labels: legacy.chatThreadZhLabels };
    const props: shared.ChatThreadProps = oldProps;
    expect(props.labels).toBe(shared.chatThreadZhLabels);
  });

  it("shares context across mixed old/new messages and isolates concurrent thread providers", async () => {
    const restore = vi.fn();
    const { container } = render(<>
      <shared.ChatThread labels={shared.chatThreadZhLabels} onRestore={restore} composer={<textarea aria-label="新输入区" />}>
        <legacy.ChatUserMessage id="question" text="混合入口" checkpoint={{ id: "checkpoint" }} />
        <legacy.ChatAssistantMessage id="reply" text="共享上下文"><shared.ChatMarkdown text="共享上下文" /></legacy.ChatAssistantMessage>
      </shared.ChatThread>
      <legacy.ChatThread composer={<textarea aria-label="Legacy draft" />}>
        <shared.ChatUserMessage id="question" text="Isolated thread" />
      </legacy.ChatThread>
    </>);
    const threads = container.querySelectorAll('[data-slot="chat-thread"]');
    expect(threads).toHaveLength(2);
    expect(within(threads[0] as HTMLElement).getByRole("log", { name: "对话" }).textContent).toContain("共享上下文");
    expect(within(threads[1] as HTMLElement).getByRole("log", { name: "Conversation" }).textContent).toContain("Isolated thread");
    expect(within(threads[1] as HTMLElement).queryByText("混合入口")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "恢复: 混合入口" }));
    fireEvent.click(await screen.findByRole("button", { name: "仅恢复对话" }));
    await waitFor(() => expect(restore).toHaveBeenCalledWith("checkpoint", { code: false }));
  });

  it("retains legacy adapter labels, explicit branch disabling and thread editor state", async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onChange = vi.fn();
    const labels = shared.chatThreadZhLabels;
    const view = (busy: boolean) => <legacy.ChatThread labels={labels} busy={busy} composer={<textarea aria-label="Draft" />}>
      <shared.ChatAssistantMessage id="adapters">
        <section aria-label="Legacy adapters">
          <legacy.ChatCopy text="Exact raw message" />
          <legacy.ChatBranchSwitch branch={{ index: 0, count: 2, onChange }} disabled={busy} />
          <legacy.ChatAttachments files={[{ id: "brief", name: "brief.md" }]} />
          <legacy.ChatEditor text="Original" onSave={onSave} onCancel={onCancel} />
        </section>
      </shared.ChatAssistantMessage>
    </legacy.ChatThread>;
    const { rerender } = render(view(false));
    const controls = within(screen.getByRole("region", { name: "Legacy adapters" }));
    fireEvent.click(controls.getByRole("button", { name: labels.copy }));
    await waitFor(() => expect(copy).toHaveBeenCalledExactlyOnceWith("Exact raw message"));
    expect(controls.getByRole("list", { name: labels.conversation })).toBeTruthy();
    fireEvent.click(controls.getByRole("button", { name: labels.next }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
    const editor = controls.getByRole("textbox", { name: labels.edit }) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: "Keep this draft" } });
    rerender(view(true));
    expect(editor.disabled).toBe(true);
    expect(editor.value).toBe("Keep this draft");
    expect((controls.getByRole("button", { name: labels.next }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(controls.getByRole("button", { name: labels.cancel }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

});
