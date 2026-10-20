// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMessage, ChatMessageAction, ChatMessageAttachment, ChatMessageAttachments, ChatMessageAuthor, ChatMessageBranchSwitch, ChatMessageCopy, ChatMessageEditor, ChatMessageMeta } from "@zeron/ui/chat-message";
import { InputMessage } from "@zeron/ui/input-message";
import { Markdown } from "@zeron/ui/markdown";

vi.mock("@zeron/ui/code-block", () => ({
  CodeBlock: ({ file }: { file: { name: string; contents: string } }) => <pre data-testid="code-block" data-name={file.name}>{file.contents}</pre>,
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("standalone ChatMessage parts", () => {
  it("composes a persistent author above content separately from response metrics", () => {
    const { container, rerender } = render(
      <ChatMessage from="assistant"
        header={<ChatMessageAuthor model="Response model" logo={<svg data-testid="model-logo" />} provider="Provider" />}
        meta={<ChatMessageMeta metrics={{ ttftMs: 420 }} />}>Reply</ChatMessage>,
    );
    const author = screen.getByText("Response model").closest('[data-slot="chat-message-author"]')!;
    expect(author.contains(screen.getByText("Provider"))).toBe(true);
    const logo = screen.getByTestId("model-logo").parentElement!;
    expect(logo.getAttribute("aria-hidden")).toBe("true");
    expect(logo.hasAttribute("inert")).toBe(true);
    expect(author.compareDocumentPosition(screen.getByText("Reply")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(author.closest('[data-slot="chat-message-footer"]')).toBeNull();
    expect(screen.getByText("TTFT 420 ms").closest('[data-slot="chat-message-footer"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="chat-message"]')?.getAttribute("header")).toBeNull();
    rerender(<ChatMessageAuthor />);
    expect(container.innerHTML).toBe("");
    rerender(<ChatMessageAuthor model="Model without logo" />);
    expect(screen.getByText("Model without logo")).toBeTruthy();
    expect(screen.queryByTestId("model-logo")).toBeNull();
  });

  it("owns the metadata footer with and without actions outside a thread provider", () => {
    const metadata = <ChatMessageMeta model="Response model" metrics={{ inputTokens: 1248 }} />;
    const { rerender } = render(<ChatMessage from="assistant" meta={metadata}>Reply</ChatMessage>);
    const model = screen.getByText("Response model");
    const footer = model.closest('[data-slot="chat-message-footer"]');
    expect(footer).toBeTruthy();
    expect(model.closest('[data-slot="chat-message"]')?.getAttribute("meta")).toBeNull();
    rerender(<ChatMessage from="assistant" meta={metadata} actions={<ChatMessageAction label="Retry" onClick={() => {}}>R</ChatMessageAction>}>Reply</ChatMessage>);
    expect(footer?.contains(screen.getByRole("button", { name: "Retry" }))).toBe(true);
    expect(model.closest('[data-slot="chat-message-footer"]')).toBe(footer);
  });

  it("provides named and controlled toggle actions without a thread provider", () => {
    const onClick = vi.fn();
    render(<ChatMessageAction label="Helpful" pressed onClick={onClick}>+</ChatMessageAction>);
    const button = screen.getByRole("button", { name: "Helpful" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("announces clipboard failure and success using caller labels", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ChatMessageCopy text="raw **source**" labels={{ copy: "复制", copied: "已复制", copyFailed: "失败" }} />);
    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("失败"));
    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("已复制"));
    expect(writeText).toHaveBeenLastCalledWith("raw **source**");
  });

  it("does not announce an old clipboard result after the source changes", async () => {
    let complete!: () => void;
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => new Promise<void>((resolve) => { complete = resolve; }) } });
    const { rerender } = render(<ChatMessageCopy text="old version" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
    rerender(<ChatMessageCopy text="new version" />);
    await act(async () => complete());
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("limits controlled version navigation to valid ranges", () => {
    const onChange = vi.fn();
    const { rerender } = render(<ChatMessageBranchSwitch branch={{ index: 0, count: 2, onChange }} />);
    expect((screen.getByRole("button", { name: "Previous version" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next version" }));
    expect(onChange).toHaveBeenLastCalledWith(1);
    rerender(<ChatMessageBranchSwitch disabled branch={{ index: 1, count: 2, onChange }} />);
    expect((screen.getByRole("button", { name: "Previous version" }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<ChatMessageBranchSwitch branch={{ index: 2, count: 2, onChange }} />);
    expect(screen.queryByRole("group")).toBeNull();
    rerender(<ChatMessageBranchSwitch branch={{ index: 0, count: 1, onChange }} />);
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("renders persisted files without synthetic File objects and rejects unsafe URLs", () => {
    render(<ChatMessageAttachments label="附件" align="start" files={[
      { id: "doc", name: "brief.md", size: 2048, url: "/brief.md" },
      { id: "image", name: "preview.png", type: "image/png", url: "https://example.com/preview.png" },
      { id: "unsafe", name: "unsafe.svg", type: "image/svg+xml", url: "javascript:alert(1)" },
      { id: "offline", name: "offline.txt" },
    ]} />);
    expect(screen.getByRole("list", { name: "附件" }).children).toHaveLength(4);
    expect(screen.getByRole("link", { name: "brief.md" }).getAttribute("href")).toBe("/brief.md");
    expect(screen.getByRole("img", { name: "preview.png" }).getAttribute("src")).toBe("https://example.com/preview.png");
    expect(screen.getByRole("img", { name: "preview.png" }).closest('[data-slot="chat-message-attachment"]')?.contains(screen.getByText("preview.png"))).toBe(true);
    expect(screen.queryByRole("link", { name: "unsafe.svg" })).toBeNull();
    expect(screen.queryByRole("img", { name: "unsafe.svg" })).toBeNull();
    expect(screen.getByText("2 KB")).toBeTruthy();
  });

  it("keeps failed edit drafts and guards IME before retrying an asynchronous save", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    const onCancel = vi.fn();
    render(<ChatMessageEditor text="Original" onSave={onSave} onCancel={onCancel} />);
    const editor = screen.getByRole("textbox", { name: "Edit message" }) as HTMLTextAreaElement;
    expect(document.activeElement).toBe(editor);
    fireEvent.change(editor, { target: { value: "更新后的消息" } });
    fireEvent.keyDown(editor, { key: "Enter", isComposing: true });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "Enter", shiftKey: true });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "Enter" });
    await screen.findByRole("alert");
    expect(editor.value).toBe("更新后的消息");
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenLastCalledWith("更新后的消息");
  });

  it("keeps a local image and its visible filename inside one attachment card and releases its URL", async () => {
    const revoke = vi.fn();
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL() { return "blob:local-preview"; }
      static revokeObjectURL(url: string) { revoke(url); }
    });
    const file = new File(["pixels"], "local-photo.png", { type: "image/png" });
    const { unmount } = render(<ChatMessageAttachment file={file} />);
    const preview = await screen.findByRole("img", { name: "local-photo.png" });
    const card = preview.closest('[data-slot="chat-message-attachment"]');
    expect(card?.contains(screen.getByText("local-photo.png"))).toBe(true);
    expect(preview.closest('[data-slot="file-thumbnail"]')?.classList.contains("border")).toBe(false);
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:local-preview");
  });

  it("uses the same named image card in the composer and retains file removal", async () => {
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL() { return "blob:composer-preview"; }
      static revokeObjectURL() {}
    });
    const onFilesChange = vi.fn();
    render(<InputMessage value="" onValueChange={() => {}} files={[new File(["pixels"], "draft.png", { type: "image/png" })]} onFilesChange={onFilesChange} />);
    const preview = await screen.findByRole("img", { name: "draft.png" });
    expect(preview.closest('[data-slot="chat-message-attachment"]')?.contains(screen.getByText("draft.png"))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove draft.png" }));
    expect(onFilesChange).toHaveBeenCalledWith([]);
  });

  it("shows response metrics after the model with localized units, including zero", () => {
    const { container, rerender } = render(<ChatMessageMeta model="Sonnet 5.5" locale="zh-CN" metrics={{ ttftMs: 420, inputTokens: 1248, outputTokens: 0, durationMs: 6820 }} />);
    expect(screen.getByText("Sonnet 5.5")).toBeTruthy();
    expect(screen.getByText("TTFT 420 ms")).toBeTruthy();
    expect(screen.getByText("输入 1.2k tokens")).toBeTruthy();
    expect(screen.getByTitle("输出 0 tokens")).toBeTruthy();
    expect(screen.getByText("耗时 6.82 s")).toBeTruthy();
    rerender(<ChatMessageMeta metrics={{ ttftMs: -1, inputTokens: 0.5, outputTokens: NaN, durationMs: Infinity }} />);
    expect(container.textContent).toBe("");
    rerender(<ChatMessageMeta locale="not_a_locale" metrics={{ durationMs: 1200 }} />);
    expect(container.textContent).toBe("Time 1.2 s");
  });

  it.each([
    [999, "999"],
    [1000, "1k"],
    [1248, "1.2k"],
    [999949, "999.9k"],
    [999950, "1M"],
    [1000000, "1M"],
    [1250000, "1.3M"],
    [999999999, "1B"],
    [1000000000, "1B"],
    [1250000000, "1.3B"],
    [1250000000000, "1,250B"],
  ])("compacts %i tokens to %s and retains the grouped exact count", (count, compact) => {
    render(<ChatMessageMeta metrics={{ inputTokens: count, outputTokens: count }} locale="zh-CN" />);
    for (const label of ["输入", "输出"]) {
      const exact = `${label} ${count.toLocaleString("zh-CN")} tokens`;
      const field = screen.getByTitle(exact);
      expect(field.querySelector('[aria-hidden="true"]')?.textContent).toBe(`${label} ${compact} tokens`);
      expect(field.querySelector(".sr-only")?.textContent).toBe(exact);
    }
  });
});

describe("standalone Markdown", () => {
  it("uses Table primitives for GFM while preserving alignment and static rows", () => {
    render(<Markdown codeVariant="plain" text={"| Name | Status | Count |\n| :--- | :---: | ---: |\n| Thread | Ready | 2 |\n| Trace | Done | 3 |"} />);
    const table = screen.getByRole("table");
    expect(table.getAttribute("data-slot")).toBe("table");
    expect(table.parentElement?.getAttribute("data-slot")).toBe("table-container");
    expect(table.querySelector('[data-slot="table-header"]')).toBeTruthy();
    expect(table.querySelectorAll('[data-slot="table-body"] > [data-slot="table-row"]')).toHaveLength(2);
    expect(table.querySelectorAll('[data-slot="table-cell"]')).toHaveLength(6);
    expect(screen.getByRole("columnheader", { name: "Status" }).style.textAlign).toBe("center");
    expect(screen.getByRole("cell", { name: "2" }).style.textAlign).toBe("right");
    expect(table.querySelector('[data-proximity-index]')).toBeNull();
    expect(table.querySelector('[node]')).toBeNull();
  });

  it("renders GFM and filters HTML and unsafe links without a thread provider", () => {
    const { container } = render(<Markdown codeVariant="plain" streaming streamingLabel="正在生成" text={"| Name | Status |\n| --- | --- |\n| Thread | Ready |\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))"} />);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("unsafe").getAttribute("href")).not.toContain("javascript:");
    expect(screen.getByRole("status", { name: "正在生成" })).toBeTruthy();
  });

  it("hands fenced source to CodeBlock and supports plain and custom renderers", () => {
    const text = "```ts\nconst ready = true;\n```";
    const { rerender } = render(<Markdown text={text} />);
    expect(screen.getByTestId("code-block").textContent).toBe("const ready = true;");
    expect(screen.getByTestId("code-block").getAttribute("data-name")).toBe("snippet.ts");
    rerender(<Markdown text={text} codeVariant="plain" />);
    expect(screen.queryByTestId("code-block")).toBeNull();
    expect(screen.getByText("const ready = true;").tagName).toBe("CODE");
    rerender(<Markdown text="A paragraph" components={{ p: ({ children }) => <p data-testid="custom">{children}</p> }} />);
    expect(screen.getByTestId("custom").textContent).toBe("A paragraph");
  });
});
