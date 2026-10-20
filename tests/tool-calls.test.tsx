// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToolCalls, ToolCallsThread, createToolCallsDemoParts, toolCallsZhLabels, type ToolCall } from "@zeron/blocks/tool-calls-01";
import { ToolCallsDemo } from "@docs/components/blocks/ToolCallsDemo";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
// Keep the disclosure, actions and thread real; the code engine has its own browser suite.
vi.mock("@zeron/ui/code-block", () => ({
  CodeBlock: ({ file }: { file: { name: string; contents: string } }) => <pre aria-label={file.name}>{file.contents}</pre>,
  CodeDiff: ({ oldFile, newFile }: { oldFile: { contents: string }; newFile: { contents: string } }) => <pre aria-label="File changes">{oldFile.contents}{newFile.contents}</pre>,
}));

class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", TestResizeObserver);
Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
});
afterEach(cleanup);

const command: ToolCall = { id: "cmd", kind: "command", label: "Run tests", command: "pnpm test", status: "approval-required" };

describe("ToolCalls", () => {
  it("discloses a summary and search matches using the existing accordion", async () => {
    render(<ToolCalls summary="Searched once" items={[{ id: "search", kind: "search", label: "Search useResults", query: "useResults", status: "completed", matches: [{ id: "m", path: "src/search.ts", line: 0, preview: "const results = useResults(query)" }] }]} />);
    expect(screen.getByRole("button", { name: "Searched once" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: /Search useResults/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Searched once" }));
    fireEvent.click(await screen.findByRole("button", { name: /Search useResults/ }));
    expect(await screen.findByText("src/search.ts:0")).toBeTruthy();
    expect(screen.getByText("const results = useResults(query)")).toBeTruthy();
  });

  it("prevents duplicate async decisions and preserves a rejected request for retry", async () => {
    let reject!: (error: Error) => void;
    const onApproval = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    render(<ToolCalls items={[command]} onApproval={onApproval} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow command" }));
    expect((screen.getByRole("button", { name: "Deny command" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Deny command" }));
    expect(onApproval).toHaveBeenCalledExactlyOnceWith(command, "allow");
    await act(async () => reject(new Error("Network failed")));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Could not submit this action. Try again.");
    expect(screen.getByRole("button", { name: "Allow command" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Run tests · Needs approval/ })).toBeTruthy();
  });

  it("requests denial without mutating execution state; terminal snapshots remove actions", () => {
    const onApproval = vi.fn();
    const { rerender } = render(<ToolCalls items={[command]} onApproval={onApproval} />);
    fireEvent.click(screen.getByRole("button", { name: "Deny command" }));
    expect(onApproval).toHaveBeenCalledWith(command, "deny");
    expect(command.status).toBe("approval-required");
    rerender(<ToolCalls items={[{ ...command, status: "denied" }]} onApproval={onApproval} />);
    expect(screen.queryByRole("button", { name: "Allow command" })).toBeNull();
  });

  it("keeps a rejected action visible when the host refreshes the same execution snapshot", async () => {
    let reject!: (error: Error) => void;
    const onApproval = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const { rerender } = render(<ToolCalls items={[command]} onApproval={onApproval} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow command" }));
    rerender(<ToolCalls items={[{ ...command, description: "Updated host metadata" }]} onApproval={onApproval} />);
    await act(async () => reject(new Error("Request failed")));
    expect(screen.getByRole("alert").textContent).toBe("Could not submit this action. Try again.");
    expect((screen.getByRole("button", { name: "Allow command" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("releases superseded actions and prevents an old request from unlocking a newer retry", async () => {
    let finishApproval!: () => void;
    let rejectRetry!: (error: Error) => void;
    const onApproval = vi.fn(() => new Promise<void>((resolve) => { finishApproval = resolve; }));
    const onRetry = vi.fn(() => new Promise<void>((_resolve, reject) => { rejectRetry = reject; }));
    const { rerender } = render(<ToolCalls items={[command]} onApproval={onApproval} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow command" }));
    rerender(<ToolCalls items={[{ ...command, status: "failed" }]} onApproval={onApproval} onRetry={onRetry} />);
    const retry = screen.getByRole("button", { name: "Retry tool" }) as HTMLButtonElement;
    expect(retry.disabled).toBe(false);
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledOnce();
    expect(retry.disabled).toBe(true);
    await act(async () => finishApproval());
    expect(retry.disabled).toBe(true);
    await act(async () => rejectRetry(new Error("Retry failed")));
    expect(screen.getByRole("alert").textContent).toBe("Could not submit this action. Try again.");
    expect(retry.disabled).toBe(false);
  });

  it("supports controlled disclosure and preserves collapse across streamed output", () => {
    const onExpandedChange = vi.fn();
    const running: ToolCall = { ...command, status: "running", output: "one" };
    const { rerender } = render(<ToolCalls items={[running]} expandedIds={[]} onExpandedChange={onExpandedChange} />);
    const trigger = screen.getByRole("button", { name: "Run tests · Running" });
    fireEvent.click(trigger);
    expect(onExpandedChange).toHaveBeenCalledWith(["cmd"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    rerender(<ToolCalls items={[{ ...running, output: "one\ntwo" }]} expandedIds={[]} onExpandedChange={onExpandedChange} />);
    expect(screen.getByRole("button", { name: "Run tests · Running" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("retains empty output and zero metrics; partial labels merge status translations", () => {
    render(<ToolCalls items={[{ ...command, status: "failed", durationMs: 0, exitCode: 0, output: "", error: "Test error" }]} locale="invalid_locale" labels={{ output: "结果", status: { failed: "测试失败" } }} onRetry={vi.fn()} />);
    expect(screen.getByText("0 ms")).toBeTruthy();
    expect(screen.getByText("Exit code 0")).toBeTruthy();
    expect(screen.getByRole("region", { name: "结果" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run tests · 测试失败" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry tool" })).toBeTruthy();
  });

  it("handles empty lists and read-only approvals without inventing an executable action", () => {
    const { rerender } = render(<ToolCalls items={[]} labels={toolCallsZhLabels} />);
    expect(screen.getByText("暂无工具调用")).toBeTruthy();
    rerender(<ToolCalls items={[{ ...command, durationMs: NaN }]} />);
    expect(screen.queryByRole("button", { name: "Allow command" })).toBeNull();
    expect(screen.getByText("Approval required to run this command.")).toBeTruthy();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("uses the shared thread for model identity and busy-to-completed response actions", () => {
    function Thread() {
      const [done, setDone] = useState(false);
      return <ToolCallsThread prompt="Check tests" parts={[{ id: "tools", kind: "tools", items: [{ ...command, status: done ? "completed" : "approval-required" }] }, { id: "text", kind: "text", text: "Checked the tests." }]}
        assistantMessageProps={{ model: "Test model", provider: "Test provider" }} composer={<textarea aria-label="Message" />} toolCallsProps={{ onApproval: () => setDone(true) }} />;
    }
    render(<Thread />);
    expect(screen.getByText("Test model")).toBeTruthy();
    expect(screen.getByText("Test provider")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Copy message" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Allow command" }));
    expect(screen.getAllByRole("button", { name: "Copy message" })).toHaveLength(2);
  });

  it("keeps the demo honest after denial and retries a failed tool through running to completion", async () => {
    render(<ToolCallsDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Deny command" }));
    expect(screen.getByText(/stopped without running tests/)).toBeTruthy();
    expect(screen.queryByText(/All three search tests pass/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Error example" }));
    expect(screen.getByRole("button", { name: "Retry tool" })).toBeTruthy();
    await waitFor(() => expect((screen.getByRole("button", { name: "Retry tool" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Retry tool" }));
    expect(screen.getByRole("button", { name: "Run pnpm test search · Running" })).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/All three search tests pass/)).toBeTruthy(), { timeout: 3000 });
  });

  it("provides every tool variant and preserves explicit denied and cancelled fixture results", () => {
    const parts = createToolCallsDemoParts("zh-CN", 7, "cancelled");
    const calls = parts.flatMap((part) => part.kind === "tools" ? part.items : []);
    expect(calls.map((call) => call.kind)).toEqual(["search", "read", "read", "write", "edit", "command"]);
    expect(calls.at(-1)?.status).toBe("cancelled");
    expect(calls.at(-1)?.output).toBeUndefined();
  });

  it("stops an early replay without inventing later file changes or running delayed steps", async () => {
    render(<ToolCallsDemo />);
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByText("Demo stopped. Completed tool activity has been kept.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Created hooks/ })).toBeNull();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 750)); });
    expect(screen.queryByRole("button", { name: "Searched once, read 2 files" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Created hooks/ })).toBeNull();
  });
});
