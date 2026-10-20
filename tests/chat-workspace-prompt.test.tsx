// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ChatWorkspaceDemo } from "../docs/components/blocks/ChatWorkspaceDemo";

vi.mock("next-intl", () => ({ useLocale: () => "zh-CN" }));
vi.mock("../packages/blocks/src/application/chat-workspace-01/artifact-code-preview", () => ({
  ArtifactCodePreview: () => <div>Preview content</div>,
}));
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => {} });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1280);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("opens the first pending revision after its tab and panel have closed, retaining the draft", async () => {
  const { container } = render(<ChatWorkspaceDemo />);
  const input = screen.getByRole("textbox") as HTMLTextAreaElement;
  fireEvent.change(input, { target: { value: "Keep this draft" } });
  expect(container.querySelector('[data-slot="container-header"]')?.textContent).toContain("还有 2 项待审阅确认的内容");
  fireEvent.click(screen.getByRole("button", { name: "关闭 theme.ts" }));
  fireEvent.click(screen.getByRole("button", { name: "收起内容" }));
  fireEvent.click(screen.getByRole("button", { name: "查看第一项待审阅内容：theme.ts" }));
  await waitFor(() => expect(screen.getByRole("tab", { name: "theme.ts" }).getAttribute("aria-selected")).toBe("true"));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("tab", { name: "theme.ts" })));
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input.value).toBe("Keep this draft");
  expect(Array.from(container.querySelectorAll("[data-thread-message]")).some((message) => message.textContent?.includes("Keep this draft"))).toBe(false);
});

it("updates the count after decisions and removes the header when every revision is confirmed", async () => {
  const { container } = render(<ChatWorkspaceDemo />);
  fireEvent.click(screen.getByRole("button", { name: "关闭 theme.ts" }));
  fireEvent.click(screen.getByRole("button", { name: "批量审阅操作" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "全部接受" }));
  await screen.findByText("还有 1 项待审阅确认的内容");
  fireEvent.click(screen.getByRole("button", { name: "查看第一项待审阅内容：theme.ts" }));
  fireEvent.click(screen.getByRole("button", { name: "拒绝" }));
  await waitFor(() => expect(container.querySelector('[data-slot="container-header"]')).toBeNull());
  expect(screen.queryByRole("button", { name: /查看第一项待审阅内容/ })).toBeNull();
});

it("appends a reopened resource after the remaining open tabs", () => {
  const { container } = render(<ChatWorkspaceDemo />);
  fireEvent.click(screen.getByRole("button", { name: "关闭 theme.ts" }));
  fireEvent.click(screen.getByRole("button", { name: "查看第一项待审阅内容：theme.ts" }));
  const tabs = container.querySelectorAll('[data-slot="artifact-tab-bar"] [data-artifact-id]');
  expect(Array.from(tabs, (tab) => tab.getAttribute("data-artifact-id"))).toEqual(["readme", "design", "website", "archive", "theme"]);
});

it("uses ChatThread response identity, reasoning and metrics while retaining workspace artifacts", () => {
  const { container } = render(<ChatWorkspaceDemo />);
  const reply = container.querySelector<HTMLElement>('[data-thread-message="result"]')!;
  const author = reply.querySelector('[data-slot="chat-message-author"]')!;
  expect(author.textContent).toContain("Sonnet 5.5");
  expect(author.textContent).toContain("Anthropic");
  expect(author.querySelector("svg")).toBeTruthy();
  expect(within(reply).getByText("TTFT 420 ms")).toBeTruthy();
  expect(reply.querySelector('[data-slot="chat-message-meta"]')?.textContent).toContain("输入");
  expect(reply.querySelector('[data-slot="chat-message-meta"]')?.textContent).toContain("输出");
  expect(reply.querySelector('[data-slot="chat-message-meta"]')?.textContent).toContain("耗时 6.82 s");
  expect(within(reply).getByRole("button", { name: /思考了 6 秒/ }).getAttribute("aria-expanded")).toBe("false");
  expect(within(reply).getByText("本次产出 · 5 项内容")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sonnet 5.5" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "添加附件" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /^上下文用量/ })).toBeTruthy();
  expect(screen.queryByText("Workspace assistant")).toBeNull();
});

it("snapshots the chosen model for a streamed response and shows its completed metrics", async () => {
  const { container } = render(<ChatWorkspaceDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  fireEvent.click(await screen.findByRole("option", { name: "Haiku 5.5" }));
  expect(container.querySelector('[data-thread-message="result"] [data-slot="chat-message-author"]')?.textContent).toContain("Sonnet 5.5");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Check the theme" } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  const reply = Array.from(container.querySelectorAll<HTMLElement>("[data-thread-message]")).at(-1)!;
  expect(reply.querySelector('[data-slot="chat-message-author"]')?.textContent).toContain("Haiku 5.5");
  expect(reply.querySelector('[data-slot="chat-message-meta"]')).toBeNull();
  expect(within(reply).getByText("Thinking…")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Haiku 5.5" }));
  fireEvent.click(await screen.findByRole("option", { name: "Opus 5.5" }));
  await within(reply).findByText(/^TTFT /, {}, { timeout: 5000 });
  expect(reply.querySelector('[data-slot="chat-message-author"]')?.textContent).toContain("Haiku 5.5");
  expect(reply.querySelector('[data-slot="chat-message-meta"]')?.textContent).toContain("输出");
  expect(reply.querySelector('[data-slot="chat-message-meta"]')?.textContent).toContain("耗时");
  expect(screen.getByRole("button", { name: "Opus 5.5" })).toBeTruthy();
});

it("resolves Auto to an actual response model and preserves stopped response details", async () => {
  const { container } = render(<ChatWorkspaceDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Sonnet 5.5" }));
  fireEvent.click(await screen.findByRole("option", { name: "Auto" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Check the theme" } });
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  const reply = Array.from(container.querySelectorAll<HTMLElement>("[data-thread-message]")).at(-1)!;
  expect(reply.querySelector('[data-slot="chat-message-author"]')?.textContent).toContain("Sonnet 5.5");
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(within(reply).getByText("回复已停止")).toBeTruthy();
  expect(reply.querySelector('[data-slot="chat-message-meta"]')?.textContent).toContain("耗时");
  fireEvent.click(within(reply).getByRole("button", { name: "重试" }));
  expect(within(reply).queryByText("回复已停止")).toBeNull();
  await within(reply).findByText(/^TTFT /, {}, { timeout: 5000 });
  expect(reply.querySelector('[data-slot="chat-message-author"]')?.textContent).toContain("Sonnet 5.5");
});
