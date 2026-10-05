// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelRouter } from "../packages/blocks/src/application/model-router-01/model-router";
import { modelRouterDemoData as data } from "../packages/blocks/src/application/model-router-01/model-router-demo-data";
import type { ModelRouterPolicy } from "../packages/blocks/src/application/model-router-01/model-router-types";

afterEach(cleanup);

describe("Model Router policy workflow", () => {
  it("follows live policy updates until edited, and follows later updates after confirmation", () => {
    const { rerender } = render(<ModelRouter data={data} animated={false} />);
    const costPolicy: ModelRouterPolicy = { ...data.policy, strategy: "cost" };
    rerender(<ModelRouter data={{ ...data, policy: costPolicy, revision: "15" }} animated={false} />);
    expect(screen.getByRole("tab", { name: "Cost" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByText("Unpublished changes")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
    rerender(<ModelRouter data={{ ...data, policy: data.policy, revision: "16" }} animated={false} />);
    expect(screen.getByRole("tab", { name: "Quality" }).getAttribute("aria-selected")).toBe("true");
    const qualityPolicy: ModelRouterPolicy = { ...data.policy, strategy: "quality" };
    rerender(<ModelRouter data={{ ...data, policy: qualityPolicy, revision: "17" }} animated={false} />);
    expect(screen.queryByText("Unpublished changes")).toBeNull();
    rerender(<ModelRouter data={{ ...data, policy: costPolicy, revision: "18" }} animated={false} />);
    expect(screen.getByRole("tab", { name: "Cost" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByText("Unpublished changes")).toBeNull();
  });

  it("does not draw a full share bar when an out-of-range ratio is unavailable", () => {
    const { container } = render(<ModelRouter data={{ ...data, routes: [{ ...data.routes[0], share: 2 }] }} animated={false} />);
    const cell = container.querySelector('[data-slot="router-table-route"] td:nth-child(2)')!;
    expect(cell.textContent).toBe("—");
    expect(cell.querySelector<HTMLElement>("[style]")?.style.width).toBe("0%");
  });

  it("links graph labels, paths and table rows while keeping policy unchanged", () => {
    const onValueChange = vi.fn();
    const { container } = render(<ModelRouter data={data} animated={false} onValueChange={onValueChange} />);
    const routePart = (slot: string, id: string) => container.querySelector(`[data-slot="${slot}"][data-route-id="${id}"]`)!;
    const expectHighlighted = (id: string | null) => {
      for (const slot of ["router-flow-route", "router-flow-label", "router-table-route"]) {
        for (const route of data.routes) {
          if (slot === "router-table-route") {
            expect(getComputedStyle(routePart(slot, route.id)).opacity || "1").toBe("1");
            expect(routePart(slot, route.id).classList.contains("bg-hover")).toBe(route.id === id);
          } else {
            expect(routePart(slot, route.id).classList.contains(id && route.id !== id ? "opacity-40" : "opacity-100")).toBe(true);
          }
        }
      }
    };
    expectHighlighted(null);
    fireEvent.mouseEnter(routePart("router-flow-label", "gpt"));
    expectHighlighted("gpt");
    expect(routePart("router-flow-label", "gpt").classList.contains("bg-hover")).toBe(false);
    expect(routePart("router-table-route", "gpt").classList.contains("bg-hover")).toBe(true);
    fireEvent.mouseLeave(routePart("router-flow-label", "gpt"));
    expectHighlighted(null);
    fireEvent.mouseEnter(routePart("router-table-route", "haiku"));
    expectHighlighted("haiku");
    fireEvent.mouseLeave(routePart("router-table-route", "haiku"));
    fireEvent.focus(routePart("router-table-route", "opus"));
    expectHighlighted("opus");
    fireEvent.mouseEnter(routePart("router-flow-route", "qwen"));
    expectHighlighted("qwen");
    fireEvent.mouseLeave(routePart("router-flow-route", "qwen"));
    expectHighlighted("opus");
    fireEvent.blur(routePart("router-table-route", "opus"));
    expectHighlighted(null);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("shows Lobe model logos in both linked views, including self-hosted Qwen", () => {
    const { container } = render(<ModelRouter data={data} animated={false} />);
    for (const slot of ["router-flow-label", "router-table-route"]) {
      for (const route of data.routes) {
        const logo = container.querySelector(`[data-slot="${slot}"][data-route-id="${route.id}"] [data-slot="router-model-logo"]`);
        expect(logo?.getAttribute("data-brand")).toBe(route.brand);
        expect(logo?.querySelector("svg")).toBeTruthy();
      }
    }
  });

  it("keeps live metrics unchanged while editing and sends the draft to deployment", async () => {
    const onDeploy = vi.fn();
    render(<ModelRouter data={data} animated={false} actions={{ onDeploy }} />);
    const deploy = screen.getByRole("button", { name: "Deploy policy" });
    expect(deploy.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "Cost" }));
    expect(screen.getByText("$0.0046")).toBeTruthy();
    expect(screen.getByText("Unpublished changes")).toBeTruthy();
    expect(deploy.hasAttribute("disabled")).toBe(false);
    fireEvent.click(deploy);
    await waitFor(() => expect(onDeploy).toHaveBeenCalledWith({ ...data.policy, strategy: "cost" }, "chat-prod"));
    expect(screen.getByText(/Policy v14/)).toBeTruthy();
  });

  it("locks submission, catches rejection and retains edits for retry", async () => {
    let reject!: (error: Error) => void;
    const onDeploy = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    render(<ModelRouter data={data} animated={false} actions={{ onDeploy }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
    fireEvent.click(screen.getByRole("button", { name: "Deploy policy" }));
    expect(screen.getByRole("button", { name: "Deploying…" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("tab", { name: "Cost" }).getAttribute("aria-disabled")).toBe("true");
    await act(async () => reject(new Error("Network unavailable")));
    expect(screen.getByRole("alert").textContent).toContain("Your changes have been kept");
    expect(screen.getByRole("tab", { name: "Quality" }).getAttribute("aria-selected")).toBe("true");
    expect(onDeploy).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Deploy policy" }).hasAttribute("disabled")).toBe(false);
  });

  it("only confirms deployment after the host updates the live snapshot", async () => {
    const onDeploy = vi.fn();
    const { rerender } = render(<ModelRouter data={data} animated={false} actions={{ onDeploy }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Cost" }));
    fireEvent.click(screen.getByRole("button", { name: "Deploy policy" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Deploy policy" }).hasAttribute("disabled")).toBe(false));
    rerender(<ModelRouter data={{ ...data, revision: "15", policy: { ...data.policy, strategy: "cost" } }} animated={false} actions={{ onDeploy }} />);
    expect(screen.queryByText("Unpublished changes")).toBeNull();
    expect(screen.getByText(/Policy v15/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deploy policy" }).hasAttribute("disabled")).toBe(true);
  });

  it("keeps controlled selection caller-owned and can discard local drafts", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<ModelRouter data={data} value={data.policy} onValueChange={onValueChange} animated={false} />);
    fireEvent.click(screen.getByRole("tab", { name: "Cost" }));
    expect(onValueChange).toHaveBeenCalledWith({ ...data.policy, strategy: "cost" });
    expect(screen.getByRole("tab", { name: "Balanced" }).getAttribute("aria-selected")).toBe("true");
    rerender(<ModelRouter data={data} animated={false} />);
    fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByRole("tab", { name: "Balanced" }).getAttribute("aria-selected")).toBe("true");
  });

  it("disables fallback selectors when switched off and blocks invalid model pairs", () => {
    const { rerender } = render(<ModelRouter data={data} animated={false} actions={{ onDeploy: vi.fn() }} />);
    fireEvent.click(screen.getByRole("switch", { name: "Fallback" }));
    expect(screen.getByRole("combobox", { name: "Failed model" }).hasAttribute("disabled")).toBe(true);
    const invalid: ModelRouterPolicy = { ...data.policy, fallback: { enabled: true, from: "opus", to: "opus" } };
    rerender(<ModelRouter data={data} value={invalid} animated={false} actions={{ onDeploy: vi.fn() }} />);
    expect(screen.getByRole("alert").textContent).toContain("two different");
    expect(screen.getByRole("button", { name: "Deploy policy" }).hasAttribute("disabled")).toBe(true);
    rerender(<ModelRouter data={{ ...data, routes: data.routes.slice(2) }} value={data.policy} animated={false} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("preserves a draft during telemetry refresh but resets it for another environment", () => {
    const { rerender } = render(<ModelRouter data={data} animated={false} />);
    fireEvent.click(screen.getByRole("tab", { name: "Cost" }));
    rerender(<ModelRouter data={{ ...data, metrics: { ...data.metrics, requestsPerSecond: 400 } }} animated={false} />);
    expect(screen.getByRole("tab", { name: "Cost" }).getAttribute("aria-selected")).toBe("true");
    rerender(<ModelRouter data={{ ...data, environment: { id: "staging", name: "staging" } }} animated={false} />);
    expect(screen.getByRole("tab", { name: "Balanced" }).getAttribute("aria-selected")).toBe("true");
  });

  it("supports missing metrics, empty routes and absent actions without fabricated zeroes", () => {
    render(<ModelRouter data={{ ...data, routes: [], policy: { ...data.policy, fallback: { ...data.policy.fallback, enabled: false } }, metrics: { requestsPerSecond: null, costPer1kTokens: null, p95Seconds: NaN, errorRate: -1 } }} animated={false} />);
    expect(screen.getByText("No model routes available.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Deploy policy" })).toBeNull();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Cost" }).getAttribute("aria-disabled")).toBe("true");
  });
});
