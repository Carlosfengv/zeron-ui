// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { McpDetail } from "../packages/blocks/src/application/mcp-detail-01/mcp-detail";
import { defaultMcpDetail, type McpConnectionResult, type McpDetailData } from "../packages/blocks/src/application/mcp-detail-01/mcp-detail-data";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
}
function service(id: string): McpDetailData {
  return {
    ...defaultMcpDetail, id, name: `Service ${id}`, agents: [],
    tools: [{ name: `tool_${id}`, description: `Tool ${id}`, defaultInput: { service: id } }],
    connectionOptions: {
      transports: [{ value: `transport_${id}`, label: `Transport ${id}` }],
      authMethods: [{ value: `auth_${id}`, label: `Auth ${id}` }],
      expirations: [{ value: `expiry_${id}`, label: `Expiry ${id}` }],
    },
  };
}
const a = service("a");
const b = service("b");

describe("MCP service session isolation", () => {
  it.each(["resolve", "reject"] as const)("ignores an old connection %s after changing services", async (outcome) => {
    const old = deferred<McpConnectionResult>();
    const onRequestConnection = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue({ streamableHttpUrl: "https://b.example/mcp" });
    const { rerender } = render(<McpDetail service={a} onRequestConnection={onRequestConnection} />);
    fireEvent.click(screen.getByRole("button", { name: "获取连接信息" }));
    rerender(<McpDetail service={b} onRequestConnection={onRequestConnection} />);
    expect(screen.getByRole("button", { name: "获取连接信息" })).toHaveProperty("disabled", false);
    await act(async () => {
      if (outcome === "resolve") old.resolve({ streamableHttpUrl: "https://a.example/mcp" });
      else old.reject(new Error("old failure"));
    });
    expect(screen.queryByDisplayValue("https://a.example/mcp")).toBeNull();
    expect(screen.queryByText(/无法获取连接信息/)).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "获取连接信息" })));
    expect(onRequestConnection).toHaveBeenLastCalledWith({ transport: "transport_b", authMethod: "auth_b", expiration: "expiry_b" });
  });

  it("clears completed connection data immediately on a service change", async () => {
    const onRequestConnection = vi.fn().mockResolvedValue({ streamableHttpUrl: "https://a.example/mcp" });
    const { container, rerender } = render(<McpDetail service={a} onRequestConnection={onRequestConnection} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "获取连接信息" })));
    expect(container.textContent).toContain("https://a.example/mcp");
    rerender(<McpDetail service={b} onRequestConnection={onRequestConnection} />);
    expect(container.textContent).not.toContain("https://a.example/mcp");
  });

  it("resets tool inputs and ignores a late tool result through A to B to A", async () => {
    const old = deferred<unknown>();
    const onRunTool = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue({ result: "fresh result" });
    const { rerender } = render(<McpDetail service={a} defaultSection="tools" onRunTool={onRunTool} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: '{"custom": true}' } });
    fireEvent.click(screen.getByRole("button", { name: "运行工具" }));
    rerender(<McpDetail service={b} defaultSection="tools" onRunTool={onRunTool} />);
    expect(screen.getByRole("textbox")).toHaveProperty("value", JSON.stringify({ service: "b" }, null, 2));
    expect(screen.getByRole("button", { name: "运行工具" })).toHaveProperty("disabled", false);
    rerender(<McpDetail service={a} defaultSection="tools" onRunTool={onRunTool} />);
    await act(async () => old.resolve({ result: "stale result" }));
    expect(screen.queryByText(/stale result/)).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "运行工具" })));
    expect(onRunTool).toHaveBeenLastCalledWith("tool_a", { service: "a" });
    expect(screen.getByText(/fresh result/)).toBeTruthy();
  });
});
