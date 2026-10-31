// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AgentRuns,
  createAgentRunsDemoData,
} from "@zeron/blocks/agent-runs-01";
import {
  agentRunsChartData,
  createAgentRunsFormatters,
  runCost,
  summarizeAgentRuns,
  validateAgentRunsData,
} from "../packages/blocks/src/application/agent-runs-01/agent-runs-data";
import { agentRunsEnLabels } from "../packages/blocks/src/application/agent-runs-01/agent-runs-labels";

vi.mock(
  "../packages/blocks/src/application/agent-runs-01/agent-runs-chart",
  () => ({
    AgentRunsChart: ({
      mode,
      onSelect,
    }: {
      mode: string;
      onSelect: (id: string) => void;
    }) => (
      <div data-testid="chart-mode">
        {mode}
        <button onClick={() => onSelect("run-1")}>Select first run</button>
      </div>
    ),
  }),
);
beforeEach(() => {
  window.matchMedia = () =>
    ({
      matches: false,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList;
});
afterEach(cleanup);

describe("Agent runs accounting", () => {
  it("conserves costs across sessions, models and cumulative events", () => {
    const data = createAgentRunsDemoData();
    expect(validateAgentRunsData(data)).toBe(true);
    const summary = summarizeAgentRuns(data.runs, data.end);
    expect(data.runs).toHaveLength(89);
    expect(summary.cost).toBeCloseTo(183.07);
    expect(
      [...summary.agentCosts.values()].reduce((sum, cost) => sum + cost, 0),
    ).toBeCloseTo(summary.cost);
    expect(
      [...summary.modelCosts.values()].reduce((sum, cost) => sum + cost, 0),
    ).toBeCloseTo(summary.cost);
    expect(summary.agentCosts.get("emacs")).toBeCloseTo(2.84);
    expect(summary.active).toBe(1);
    expect(summary.cancelled).toBe(3);
    expect(summary.unreported).toBe(1);
    expect(
      data.models.map((model) =>
        data.runs
          .filter((run) => run.modelId === model.id)
          .reduce((sum, run) => sum + (runCost(run) ?? 0), 0),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.closeTo(152),
        expect.closeTo(28.23),
        expect.closeTo(2.84),
      ]),
    );
    const chart = agentRunsChartData(data, "cumulative");
    expect(chart[0]).toEqual({ date: data.start, value: 0 });
    expect(chart.at(-1)).toEqual({
      date: data.end,
      value: expect.closeTo(summary.cost),
    });
    expect(agentRunsChartData(data, "per-run")).toHaveLength(88);
    expect(
      chart.every((point, i) => i === 0 || point.value >= chart[i - 1].value),
    ).toBe(true);
  });
  it("keeps unreported usage unknown and merges simultaneous cumulative postings", () => {
    const data = createAgentRunsDemoData();
    const run = data.runs[0];
    const simultaneous = {
      ...data,
      runs: [
        run,
        { ...data.runs[1], endedAt: run.endedAt, startedAt: run.startedAt },
      ],
    };
    const chart = agentRunsChartData(simultaneous, "cumulative");
    expect(chart.filter((point) => point.date === run.endedAt)).toHaveLength(1);
    expect(chart[1].value).toBeCloseTo(runCost(run)! + runCost(data.runs[1])!);
    expect(runCost(data.runs.at(-1)!)).toBeNull();
    expect(
      agentRunsChartData({ ...data, runs: [data.runs.at(-1)!] }, "per-run"),
    ).toEqual([]);
    expect(
      agentRunsChartData({ ...data, runs: [data.runs.at(-1)!] }, "cumulative"),
    ).toEqual([]);
  });
  it("rejects invalid time ranges, references, duplicate IDs and unsafe accounting", () => {
    const data = createAgentRunsDemoData(),
      run = data.runs[0];
    for (const invalid of [
      { ...data, end: data.start },
      { ...data, start: NaN },
      { ...data, runs: [run, run] },
      { ...data, runs: [{ ...run, agentId: "missing" }] },
      { ...data, runs: [{ ...run, modelId: undefined }] },
      { ...data, runs: [{ ...run, endedAt: run.startedAt - 1 }] },
      { ...data, runs: [{ ...run, status: "running" as const }] },
      {
        ...data,
        runs: [
          { ...run, usage: { ...run.usage!, input: { tokens: -1, cost: 0 } } },
        ],
      },
      {
        ...data,
        runs: [
          {
            ...run,
            usage: { ...run.usage!, output: { tokens: 1, cost: Infinity } },
          },
        ],
      },
    ])
      expect(validateAgentRunsData(invalid)).toBe(false);
    expect(validateAgentRunsData({ ...data, runs: [] })).toBe(true);
  });
  it("groups calendar days in the host timezone and uses input-only cache denominators", () => {
    const format = createAgentRunsFormatters(
      "en-US",
      "Asia/Shanghai",
      "USD",
      agentRunsEnLabels,
    );
    expect(format.day(Date.parse("2026-10-30T17:00:00Z"))).toBe("2026-10-31");
    const run = createAgentRunsDemoData().runs[0];
    const summary = summarizeAgentRuns(
      [
        {
          ...run,
          usage: {
            input: { tokens: 2, cost: 0 },
            output: { tokens: 999, cost: 0 },
            cacheRead: { tokens: 98, cost: 0 },
            cacheWrite: { tokens: 999, cost: 0 },
          },
        },
      ],
      run.endedAt!,
    );
    expect(summary.cacheRatio).toBe(0.98);
  });
  it("preserves a valid timezone when locale falls back, and preserves locale when timezone falls back", () => {
    const boundary = Date.parse("2026-10-30T17:00:00Z");
    const invalidLocale = createAgentRunsFormatters(
      "invalid_locale",
      "Asia/Shanghai",
      "USD",
      agentRunsEnLabels,
    );
    expect(invalidLocale.day(boundary)).toBe("2026-10-31");
    const invalidZone = createAgentRunsFormatters(
      "zh-CN",
      "invalid-zone",
      "USD",
      agentRunsEnLabels,
    );
    expect(invalidZone.day(boundary)).toBe("2026-10-30");
    expect(invalidZone.compact(10_000)).toBe("1万");
  });
  it("keeps fractional chart ticks distinct and preserves nonzero sub-cent costs", () => {
    const format = createAgentRunsFormatters(
      "en-US",
      "UTC",
      "USD",
      agentRunsEnLabels,
    );
    expect(format.axisMoney(0.02)).toBe("$0.02");
    expect(format.axisMoney(0.04)).toBe("$0.04");
    expect(format.axisMoney(150)).toBe("$150");
    expect(format.money(0.0042)).toBe("$0.0042");
    expect(format.money(5.78)).toBe("$5.78");
    expect(format.money(0)).toBe("$0.00");
    const yen = createAgentRunsFormatters(
      "en-US",
      "UTC",
      "JPY",
      agentRunsEnLabels,
    );
    expect(yen.money(0.42)).not.toBe(yen.money(0));
  });
});

describe("Agent runs interaction", () => {
  it("paginates sessions without counting section headers or details and reconciles host page-size/data updates", () => {
    const data = createAgentRunsDemoData();
    const { container, rerender } = render(
      <AgentRuns data={data} defaultExpandedRunId="run-86" />,
    );
    const recordRows = () =>
      container.querySelectorAll('[data-slot="table-row"][data-row-id]');
    expect(recordRows()).toHaveLength(6);
    expect(
      container.querySelectorAll('[data-slot="data-table-pagination"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-slot="data-table-expanded-row"]'),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 2 of 15")).toBeTruthy();
    rerender(
      <AgentRuns data={data} pageSize={8} defaultExpandedRunId="run-86" />,
    );
    expect(screen.getByText("Page 1 of 12")).toBeTruthy();
    expect(recordRows()).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    rerender(
      <AgentRuns
        data={{ ...data, runs: data.runs.slice(0, 3) }}
        pageSize={8}
      />,
    );
    expect(screen.getByText("Page 1 of 1")).toBeTruthy();
    expect(recordRows()).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(true);
  });
  it("locates a default expanded session and resets local state when the project changes", () => {
    const data = createAgentRunsDemoData(),
      onClose = vi.fn();
    const { rerender } = render(
      <AgentRuns data={data} defaultExpandedRunId="run-1" onClose={onClose} />,
    );
    expect(
      document
        .querySelector('[data-row-id="run-1"][aria-expanded]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
    rerender(
      <AgentRuns
        data={{ ...data, id: "another-project" }}
        defaultExpandedRunId="run-86"
        onClose={onClose}
      />,
    );
    expect(
      document
        .querySelector('[data-row-id="run-86"][aria-expanded]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
    expect(screen.getByText("Page 1 of 15")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close runs" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it("expands cost details, invokes the exact session callback and pages through all records", () => {
    const data = createAgentRunsDemoData(),
      onOpenSession = vi.fn();
    render(
      <AgentRuns
        data={data}
        defaultExpandedRunId="run-86"
        onOpenSession={onOpenSession}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open session" }));
    expect(onOpenSession).toHaveBeenCalledExactlyOnceWith(data.runs[85]);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Page 2 of 15")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Select first run" }));
    expect(
      document
        .querySelector('[data-row-id="run-1"][aria-expanded]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled"),
    ).toBe(true);
  });
  it("notifies controlled mode changes and waits for the host to update the value", () => {
    const data = createAgentRunsDemoData(),
      onModeChange = vi.fn();
    const { rerender } = render(
      <AgentRuns data={data} mode="cumulative" onModeChange={onModeChange} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Per run" }));
    expect(onModeChange).toHaveBeenCalledExactlyOnceWith("per-run");
    expect(screen.getByTestId("chart-mode").textContent).toContain(
      "cumulative",
    );
    rerender(
      <AgentRuns data={data} mode="per-run" onModeChange={onModeChange} />,
    );
    expect(screen.getByTestId("chart-mode").textContent).toContain("per-run");
  });
  it("shows unreported, loading, empty and recoverable error states", () => {
    const data = createAgentRunsDemoData(),
      onRetry = vi.fn();
    const { rerender } = render(
      <AgentRuns data={data} defaultExpandedRunId="run-active" />,
    );
    expect(
      screen.getByText("Usage has not been reported for this session."),
    ).toBeTruthy();
    rerender(<AgentRuns data={data} state="loading" />);
    expect(screen.getByRole("status").textContent).toContain("Loading runs");
    rerender(<AgentRuns data={data} state="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<AgentRuns data={{ ...data, runs: [] }} />);
    expect(screen.getByText("No runs in this period")).toBeTruthy();
    expect(screen.queryByTestId("chart-mode")).toBeNull();
  });
});
