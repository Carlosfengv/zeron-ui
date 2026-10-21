import { describe, expect, it } from "vitest";
import {
  buildAgentMessageTraceUsage,
  createLiveTraceTicks,
  formatLiveTraceCost,
  formatLiveTraceDuration,
  liveSpanDuration,
} from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-live-model";
import {
  agentMessageTraceLiveDemoData,
  createAgentMessageTraceLiveDemoData,
} from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-live-demo-data";
import type { AgentMessageTraceSpan } from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-types";

describe("live message trace projection", () => {
  it("counts each call once and derives inclusive parent costs from exclusive usage", () => {
    const usage = buildAgentMessageTraceUsage(
      agentMessageTraceLiveDemoData.spans,
    );
    expect(usage.costUsd).toBeCloseTo(0.49);
    expect(usage.costs.get("orchestrator")).toBeCloseTo(0.49);
    expect(usage.costs.get("researcher")).toBeCloseTo(0.05);
    expect(usage.costs.get("writer")).toBeCloseTo(0.09);
    expect(usage.costs.get("coder")).toBeCloseTo(0.23);
    expect(usage).toMatchObject({
      tokens: 99_700,
      llmCalls: 5,
      toolCalls: 14,
      errors: 1,
      slowestSpanId: "draft",
    });
  });

  it("does not count duplicate ids or propagate negative and nonfinite usage", () => {
    const spans: AgentMessageTraceSpan[] = [
      {
        id: "root",
        parentId: null,
        kind: "agent",
        name: "Root",
        startOffsetMs: 0,
        durationMs: 10,
        status: "success",
      },
      {
        id: "call",
        parentId: "root",
        kind: "chat",
        name: "Call",
        startOffsetMs: 0,
        durationMs: 5,
        status: "success",
        usage: { costUsd: 0.1, inputTokens: 10, outputTokens: -5 },
      },
      {
        id: "call",
        parentId: "root",
        kind: "chat",
        name: "Duplicate",
        startOffsetMs: 0,
        durationMs: 5,
        status: "error",
        usage: { costUsd: 20 },
      },
      {
        id: "bad",
        parentId: "root",
        kind: "tool",
        name: "Bad",
        startOffsetMs: 1,
        status: "running",
        usage: { costUsd: Infinity, inputTokens: NaN },
      },
    ];
    const usage = buildAgentMessageTraceUsage(spans);
    expect(usage).toMatchObject({
      costUsd: 0.1,
      tokens: 10,
      llmCalls: 1,
      toolCalls: 1,
      errors: 0,
    });
    expect(usage.costs.get("root")).toBeCloseTo(0.1);
  });

  it("retains the failed attempt after a successful retry and hides future spans", () => {
    const running = createAgentMessageTraceLiveDemoData(47_000);
    const attempt = running.spans.find(
      (item) => item.id === "checkout-failed",
    )!;
    expect(attempt.status).toBe("running");
    expect(attempt.error).toBeUndefined();
    expect(attempt.durationMs).toBeUndefined();
    expect(liveSpanDuration(attempt, 47_000)).toBe(4000);
    expect(running.spans.some((item) => item.id === "fix-coupon")).toBe(false);
    const afterFailure = createAgentMessageTraceLiveDemoData(52_000);
    expect(
      afterFailure.spans.find((item) => item.id === "checkout-failed")?.status,
    ).toBe("error");
    expect(
      afterFailure.spans.find((item) => item.id === "fix-coupon")?.status,
    ).toBe("running");
    const completed = createAgentMessageTraceLiveDemoData();
    expect(
      completed.spans.find((item) => item.id === "checkout-retry")?.status,
    ).toBe("success");
    expect(buildAgentMessageTraceUsage(completed.spans).errors).toBe(1);
    expect(completed.spans.every((item) => item.status !== "running")).toBe(
      true,
    );
  });

  it("creates monotonic adaptive ticks with space after the live cursor", () => {
    for (const elapsed of [0, NaN, 5100, 11_000, 47_000, 82_000, 100_000_000]) {
      const { domainEnd, ticks } = createLiveTraceTicks(elapsed);
      expect(Number.isFinite(domainEnd)).toBe(true);
      expect(ticks.length).toBeGreaterThan(1);
      expect(ticks[0]).toEqual({ value: 0, position: 0 });
      expect(ticks.at(-1)?.position).toBeLessThanOrEqual(1);
      expect(domainEnd).toBeGreaterThan(Number.isFinite(elapsed) ? elapsed : 0);
    }
    expect(
      createLiveTraceTicks(82_000).ticks.map((tick) => tick.value),
    ).toEqual([0, 30_000, 60_000, 90_000]);
  });

  it("expands the domain continuously across former scale boundaries", () => {
    // Previously 7407 -> 7408ms jumped from a 10s domain to 15s, shrinking all bars.
    for (const elapsed of [7407, 14_814, 29_629, 59_259, 88_888]) {
      const before = createLiveTraceTicks(elapsed).domainEnd;
      const after = createLiveTraceTicks(elapsed + 1).domainEnd;
      expect(after - before).toBeCloseTo(1.35);
      expect(after / before).toBeLessThan(1.001);
    }
  });

  it("formats minute boundaries, small tool costs, and invalid numbers safely", () => {
    expect(formatLiveTraceDuration(82_000)).toBe("1m 22s");
    expect(formatLiveTraceDuration(60_000)).toBe("1m");
    expect(formatLiveTraceDuration(59_800)).toBe("60s");
    expect(formatLiveTraceDuration(NaN)).toBe("0s");
    expect(formatLiveTraceCost(0.005)).toBe("$0.005");
    expect(formatLiveTraceCost(0.49)).toBe("$0.49");
  });
});
