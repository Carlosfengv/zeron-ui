// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatMarkdownResponse, createChatMarkdownDemoText } from "@zeron/blocks/chat-markdown-01";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("ChatMarkdownResponse", () => {
  it("respects explicitly hidden actions and omits actions for whitespace-only responses", () => {
    const { container, rerender } = render(<ChatMarkdownResponse text="Reply" actions={null} />);
    expect(screen.queryByRole("button", { name: "Copy message" })).toBeNull();
    expect(container.querySelector('[data-slot="chat-message-footer"]')).toBeNull();
    rerender(<ChatMarkdownResponse text={"  \n\t"} />);
    expect(screen.queryByRole("button", { name: "Copy message" })).toBeNull();
    rerender(<ChatMarkdownResponse text="Reply" />);
    expect(screen.getByRole("button", { name: "Copy message" })).not.toBeNull();
  });
  it("hides actions during streaming, then copies the retained Markdown with feedback", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const labels = { copy: "复制回复", copied: "已复制", copyFailed: "复制失败" };
    const { rerender } = render(<ChatMarkdownResponse text="**Partial**" streaming copyLabels={labels} />);
    expect(screen.queryByRole("button", { name: "复制回复" })).toBeNull();
    expect(document.querySelector("article")?.getAttribute("aria-busy")).toBe("true");
    rerender(<ChatMarkdownResponse text="**Partial**" copyLabels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: "复制回复" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("复制失败"));
    fireEvent.click(screen.getByRole("button", { name: "复制回复" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("已复制"));
    expect(writeText).toHaveBeenLastCalledWith("**Partial**");
  });

  it("uses caller-owned identity and actions and renders original localized demo content", () => {
    render(<ChatMarkdownResponse text={createChatMarkdownDemoText("zh-CN")} codeVariant="plain" author={<span>Model identity</span>} actions={<button>Custom action</button>} />);
    expect(screen.getByText("Model identity")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Custom action" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Copy message" })).toBeNull();
    expect(screen.getByRole("heading", { name: "让搜索结果跟上你的输入" })).not.toBeNull();
    expect(createChatMarkdownDemoText("en")).toContain("Keep search in step");
  });
});
