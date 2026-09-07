/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RuleFlowEditor,
  defaultRuleFlow,
  type RuleFlowValue,
} from "../packages/blocks/src/application/rule-flow-editor-01";

const configuredFlow: RuleFlowValue = {
  trigger: { type: "incoming-request" },
  conditions: [
    {
      id: "condition-1",
      field: "request.source",
      operator: "equals",
      value: "public",
    },
  ],
  conditionMatch: "all",
  outcomes: {
    matched: [{ id: "matched-action-1", type: "reject-request" }],
    unmatched: { behavior: "skip-rule" },
    error: [
      {
        id: "error-policy-detection-service-unavailable",
        type: "detection-service-unavailable",
        config: { behavior: "allow" },
      },
    ],
  },
};

afterEach(cleanup);

describe("RuleFlowEditor", () => {
  it("starts with empty business data and an instructional flow skeleton", () => {
    const onValueChange = vi.fn();
    render(<RuleFlowEditor onValueChange={onValueChange} />);

    expect(defaultRuleFlow.trigger).toBeNull();
    expect(defaultRuleFlow.conditions).toEqual([]);
    expect(defaultRuleFlow.outcomes).toEqual({
      matched: [],
      unmatched: { behavior: "skip-rule" },
      error: [],
    });
    expect(
      screen.getByRole("combobox", { name: "选择流量入口" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "添加条件" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByText("结束——不执行本规则")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "选择处置动作" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(
      screen.queryByRole("combobox", {
        name: "检测服务不可用时处理方式",
      }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "添加异常分支" }),
    ).toHaveProperty("disabled", true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps the optional exception branch hidden until requested", () => {
    const value: RuleFlowValue = {
      ...configuredFlow,
      outcomes: { ...configuredFlow.outcomes, error: [] },
    };
    render(<RuleFlowEditor value={value} />);

    expect(
      screen.queryByRole("combobox", {
        name: "检测服务不可用时处理方式",
      }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "添加异常分支" }));

    expect(
      screen.getByRole("combobox", {
        name: "检测服务不可用时处理方式",
      }),
    ).toBeTruthy();
    expect(screen.getByText("命中后的结果")).toBeTruthy();
    expect(screen.getByText("执行失败时")).toBeTruthy();
  });

  it("aligns the left edges of every card in the primary flow", () => {
    render(<RuleFlowEditor value={configuredFlow} />);

    const nodeBadge = (element: HTMLElement) => {
      const card = element.closest<HTMLElement>("[data-slot=card]");
      const badge = card?.parentElement?.firstElementChild as HTMLElement | null;
      expect(badge).not.toBeNull();
      return badge!;
    };
    const nodeLeft = (element: HTMLElement) => {
      const card = element.closest<HTMLElement>("[data-slot=card]");
      const node = card?.parentElement;
      expect(node).not.toBeNull();
      return Number.parseFloat(node!.style.left) -
        Number.parseFloat(node!.style.width) / 2;
    };
    const triggerHandle = screen.getByRole("button", {
      name: "移动进入服务的请求",
    });
    const conditionTitle = screen.getByText("满足以下全部条件");
    const actionTitle = screen.getByText("拒绝本次调用");

    expect(nodeLeft(triggerHandle)).toBe(16);
    expect(nodeLeft(conditionTitle)).toBe(16);
    expect(nodeLeft(actionTitle)).toBe(16);
    expect(nodeBadge(conditionTitle).style.backgroundColor).toBe("var(--brand)");
    expect(nodeBadge(conditionTitle).style.color).toBe("var(--fg-on-brand)");
    expect(nodeBadge(actionTitle).style.backgroundColor).toBe("var(--brand)");
    expect(nodeBadge(actionTitle).style.color).toBe("var(--fg-on-brand)");
  });

  it("attaches non-trigger flow badges flush to their cards", () => {
    render(<RuleFlowEditor value={configuredFlow} />);

    const nodeBadge = (element: HTMLElement) => {
      const card = element.closest<HTMLElement>("[data-slot=card]");
      const badge = card?.parentElement?.firstElementChild as HTMLElement | null;
      expect(badge).not.toBeNull();
      return badge!;
    };
    const attachedBadges = [
      screen.getByText("满足以下全部条件"),
      screen.getByText("拒绝本次调用"),
      screen.getByText("检测服务不可用时"),
      screen.getByText("结束——不执行本规则"),
    ].map(nodeBadge);

    for (const badge of attachedBadges) {
      expect(badge.className).toContain("rounded-bl-none");
      expect(badge.className).toContain("rounded-br-none");
      expect(badge.parentElement?.className).toContain("gap-0");
    }

    const triggerBadge = nodeBadge(
      screen.getByRole("button", { name: "移动进入服务的请求" }),
    );
    expect(triggerBadge.className).not.toContain("rounded-bl-none");
    expect(triggerBadge.parentElement?.className).toContain("gap-1.5");
  });

  it("uses a direct unmatched connector and orthogonal primary branches", () => {
    const { container } = render(<RuleFlowEditor value={configuredFlow} />);
    const primaryPath = container.querySelector<SVGPathElement>(
      '[data-edge-id="conditions-matched"]',
    );
    const branchPath = container.querySelector<SVGPathElement>(
      '[data-edge-id="conditions-unmatched"]',
    );
    const errorPath = container.querySelector<SVGPathElement>(
      '[data-edge-id="conditions-error"]',
    );

    expect(primaryPath?.getAttribute("d")).toMatch(/^M 40 .+ V /);
    expect(primaryPath?.getAttribute("d")).not.toContain(" C ");
    expect(branchPath?.getAttribute("d")).toMatch(/^M 636 248 H /);
    expect(branchPath?.getAttribute("d")).toMatch(/ H 732$/);
    expect(branchPath?.getAttribute("d")).not.toContain(" V ");
    expect(branchPath?.getAttribute("d")).not.toContain(" C ");
    expect(errorPath?.getAttribute("d")).toMatch(/^M 326 .+ V /);
    expect(errorPath?.getAttribute("d")).toContain(" H ");
  });

  it("places unmatched beside conditions and exceptions beside matched actions", () => {
    render(<RuleFlowEditor value={configuredFlow} />);

    const nodeBox = (element: HTMLElement) => {
      const node = element.closest<HTMLElement>("[data-slot=card]")
        ?.parentElement;
      expect(node).not.toBeNull();
      return {
        left:
          Number.parseFloat(node!.style.left) -
          Number.parseFloat(node!.style.width) / 2,
        top: Number.parseFloat(node!.style.top),
        width: Number.parseFloat(node!.style.width),
      };
    };
    const matched = nodeBox(screen.getByText("拒绝本次调用"));
    const condition = nodeBox(screen.getByText("满足以下全部条件"));
    const exception = nodeBox(screen.getByText("检测服务不可用时"));
    const unmatched = nodeBox(screen.getByText("结束——不执行本规则"));

    expect(exception.left - (matched.left + matched.width)).toBe(24);
    expect(exception.left).toBeLessThan(unmatched.left);
    expect(exception.top).toBe(matched.top);
    expect(unmatched.top).toBe(condition.top);
  });

  it("groups matched actions in one card and persists their sorted order", () => {
    const onValueChange = vi.fn();
    const value: RuleFlowValue = {
      ...configuredFlow,
      outcomes: {
        ...configuredFlow.outcomes,
        matched: [
          { id: "matched-action-1", type: "reject-request" },
          { id: "matched-action-2", type: "forward-to-upstream" },
        ],
      },
    };
    render(<RuleFlowEditor onValueChange={onValueChange} value={value} />);

    const rejectCard = screen
      .getByText("拒绝本次调用")
      .closest<HTMLElement>("[data-slot=card]");
    const forwardCard = screen
      .getByText("转发到")
      .closest<HTMLElement>("[data-slot=card]");
    expect(rejectCard).toBe(forwardCard);

    const forwardHandle = screen.getByRole("button", {
      name: "Reorder 转发到",
    });
    fireEvent.keyDown(forwardHandle, { key: " " });
    fireEvent.keyDown(forwardHandle, { key: "ArrowUp" });
    fireEvent.keyDown(forwardHandle, { key: "Enter" });

    const next = onValueChange.mock.calls.at(-1)?.[0] as RuleFlowValue;
    expect(next.outcomes.matched.map((action) => action.id)).toEqual([
      "matched-action-2",
      "matched-action-1",
    ]);
  });

  it("stores action field edits in the selected action config", () => {
    const onValueChange = vi.fn();
    const value: RuleFlowValue = {
      ...configuredFlow,
      outcomes: {
        ...configuredFlow.outcomes,
        matched: [
          { id: "matched-action-1", type: "rewrite-request-header" },
        ],
      },
    };
    render(<RuleFlowEditor onValueChange={onValueChange} value={value} />);

    fireEvent.change(screen.getByRole("textbox", { name: "请求头改为" }), {
      target: { value: "x-tenant-id" },
    });

    const next = onValueChange.mock.calls.at(-1)?.[0] as RuleFlowValue;
    expect(next.outcomes.matched[0]?.config).toEqual({
      value: "x-tenant-id",
    });
  });

  it("inserts newly selected actions into their persisted execution phase", () => {
    const onValueChange = vi.fn();
    const value: RuleFlowValue = {
      ...configuredFlow,
      outcomes: {
        ...configuredFlow.outcomes,
        matched: [
          { id: "matched-action-1", type: "rewrite-response-header" },
        ],
      },
    };
    render(<RuleFlowEditor onValueChange={onValueChange} value={value} />);

    fireEvent.click(screen.getByRole("combobox", { name: "选择处置动作" }));
    fireEvent.click(screen.getByRole("option", { name: "拒绝本次调用" }));

    const next = onValueChange.mock.calls.at(-1)?.[0] as RuleFlowValue;
    expect(next.outcomes.matched.map((action) => action.type)).toEqual([
      "reject-request",
      "rewrite-response-header",
    ]);
  });

  it("adds blank AND conditions without silently choosing values", () => {
    const onValueChange = vi.fn();
    const value: RuleFlowValue = {
      ...defaultRuleFlow,
      trigger: { type: "incoming-request" },
    };
    render(<RuleFlowEditor onValueChange={onValueChange} value={value} />);

    fireEvent.click(screen.getByRole("button", { name: "添加条件" }));
    fireEvent.click(screen.getByRole("button", { name: "添加条件" }));

    expect(onValueChange).toHaveBeenCalledTimes(2);
    const next = onValueChange.mock.calls[1][0] as RuleFlowValue;
    expect(next.conditionMatch).toBe("all");
    expect(next.conditions).toHaveLength(2);
    expect(next.conditions[0]).toMatchObject({
      field: "",
      operator: "",
      value: "",
    });
    expect(next.outcomes.unmatched).toEqual({ behavior: "skip-rule" });
  });

  it("removes mutation controls in read-only mode", () => {
    render(<RuleFlowEditor readOnly value={configuredFlow} />);

    expect(screen.getAllByText("进入服务的请求")).toHaveLength(2);
    expect(screen.getByText("拒绝本次调用")).toBeTruthy();
    expect(screen.getByText("检测服务不可用时")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "添加条件" })).toBeNull();
    expect(screen.queryByRole("button", { name: "删除动作" })).toBeNull();
    expect(screen.queryByRole("button", { name: /移动/ })).toBeNull();
  });

  it("stores exception policy selections without creating sortable actions", () => {
    const onValueChange = vi.fn();
    const value: RuleFlowValue = {
      ...configuredFlow,
      outcomes: { ...configuredFlow.outcomes, error: [] },
    };
    render(<RuleFlowEditor onValueChange={onValueChange} value={value} />);

    fireEvent.click(screen.getByRole("button", { name: "添加异常分支" }));
    const policySelect = screen.getByRole("combobox", {
      name: "检测服务不可用时处理方式",
    });
    expect(
      screen.queryByRole("button", { name: "选择异常处理" }),
    ).toBeNull();
    fireEvent.click(policySelect);
    fireEvent.click(screen.getByRole("option", { name: "放行" }));

    const next = onValueChange.mock.calls.at(-1)?.[0] as RuleFlowValue;
    expect(next.outcomes.error).toEqual([
      {
        id: "error-policy-detection-service-unavailable",
        type: "detection-service-unavailable",
        config: { behavior: "allow" },
      },
    ]);
    expect(
      screen.queryByRole("button", { name: "Reorder 检测服务不可用时" }),
    ).toBeNull();
  });

  it("does not offer an empty exception branch without policy definitions", () => {
    const value: RuleFlowValue = {
      ...configuredFlow,
      outcomes: { ...configuredFlow.outcomes, error: [] },
    };
    render(<RuleFlowEditor errorActions={[]} value={value} />);

    expect(
      screen.queryByRole("button", { name: "添加异常分支" }),
    ).toBeNull();
    expect(screen.queryByText("0/0 项策略已配置")).toBeNull();
  });

  it("moves a configured node with the keyboard and stores layout separately", () => {
    const onValueChange = vi.fn();
    const onSelectedNodeIdChange = vi.fn();
    render(
      <RuleFlowEditor
        onSelectedNodeIdChange={onSelectedNodeIdChange}
        onValueChange={onValueChange}
        value={configuredFlow}
      />,
    );

    fireEvent.keyDown(
      screen.getByRole("button", { name: "移动进入服务的请求" }),
      { key: "ArrowRight" },
    );

    expect(onSelectedNodeIdChange).toHaveBeenCalledWith("trigger");
    const next = onValueChange.mock.calls[0][0] as RuleFlowValue;
    expect(next.layout?.nodePositions.trigger.x).toBeGreaterThan(0.18);
    expect(next.layout?.nodePositions.trigger.x).toBeLessThan(0.3);
    expect(next.trigger).toEqual(configuredFlow.trigger);
    expect(next.conditions).toEqual(configuredFlow.conditions);
  });

  it("moves the condition group by dragging its card header", () => {
    const onValueChange = vi.fn();
    render(<RuleFlowEditor onValueChange={onValueChange} value={configuredFlow} />);

    expect(
      screen.queryByRole("button", { name: "移动满足以下全部条件" }),
    ).toBeNull();
    const title = screen.getByText("满足以下全部条件");
    const card = title.closest<HTMLElement>("[data-slot=card]");
    expect(card).not.toBeNull();
    Object.defineProperties(card!, {
      setPointerCapture: { value: vi.fn() },
      hasPointerCapture: { value: vi.fn(() => true) },
      releasePointerCapture: { value: vi.fn() },
    });

    fireEvent.pointerDown(title, {
      clientX: 520,
      clientY: 210,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(card!, {
      clientX: 600,
      clientY: 270,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.pointerUp(card!, {
      clientX: 600,
      clientY: 270,
      pointerId: 1,
      pointerType: "mouse",
    });

    const next = onValueChange.mock.calls.at(-1)?.[0] as RuleFlowValue;
    expect(next.layout?.nodePositions.conditions.x).toBeGreaterThan(0.38);
    expect(next.layout?.nodePositions.conditions.x).toBeLessThan(0.5);
    expect(next.layout?.nodePositions.conditions.y).toBeGreaterThan(190);
  });

  it("does not drag when interacting with condition controls", () => {
    const onValueChange = vi.fn();
    render(<RuleFlowEditor onValueChange={onValueChange} value={configuredFlow} />);

    const fieldControl = screen.getByRole("combobox", { name: "条件字段" });
    const card = fieldControl.closest<HTMLElement>("[data-slot=card]");
    expect(card).not.toBeNull();

    fireEvent.pointerDown(fieldControl, {
      clientX: 300,
      clientY: 260,
      pointerId: 2,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(card!, {
      clientX: 380,
      clientY: 320,
      pointerId: 2,
      pointerType: "mouse",
    });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not capture pointer events from a portaled select popup", () => {
    render(<RuleFlowEditor value={configuredFlow} />);

    const fieldControl = screen.getByRole("combobox", { name: "条件字段" });
    const card = fieldControl.closest<HTMLElement>("[data-slot=card]");
    const setPointerCapture = vi.fn();
    expect(card).not.toBeNull();
    Object.defineProperty(card!, "setPointerCapture", { value: setPointerCapture });

    fireEvent.click(fieldControl);
    const option = screen.getByRole("option", { name: "风险等级" });
    fireEvent.pointerDown(option, { pointerId: 3, pointerType: "mouse" });
    expect(setPointerCapture).not.toHaveBeenCalled();
  });
});
