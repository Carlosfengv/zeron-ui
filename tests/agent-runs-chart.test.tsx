// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AgentRunsChart } from "../packages/blocks/src/application/agent-runs-01/agent-runs-chart";
import { createAgentRunsDemoData } from "@zeron/blocks/agent-runs-01";
import { createAgentRunsFormatters } from "../packages/blocks/src/application/agent-runs-01/agent-runs-data";
import { agentRunsEnLabels as labels } from "../packages/blocks/src/application/agent-runs-01/agent-runs-labels";

const { axis } = vi.hoisted(() => ({ axis: vi.fn() }));
vi.mock("@zeron/ui/area-chart", () => ({
  AreaChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Area: () => null,
}));
vi.mock("@zeron/ui/chart-core", () => ({
  Grid: () => null,
  YAxis: () => null,
  XAxis: (props: unknown) => {
    axis(props);
    return null;
  },
  ChartTooltip: () => null,
  TooltipContent: () => null,
}));
const format = createAgentRunsFormatters(
  "en-US",
  "Asia/Shanghai",
  "USD",
  labels,
);
const props = () => ({
  data: createAgentRunsDemoData(),
  mode: "cumulative" as const,
  labels,
  format,
  onSelect: vi.fn(),
});
afterEach(cleanup);
beforeEach(() => axis.mockClear());
describe("Agent runs chart adapter", () => {
  it("uses time labels for short windows and date labels for multi-day windows", () => {
    const base = props();
    const start = Date.parse("2026-10-31T10:00:00+08:00");
    const shortData = {
      ...base.data,
      start,
      runs: [
        {
          ...base.data.runs[0],
          status: "completed" as const,
          startedAt: start,
          endedAt: start + 1000,
        },
      ],
    };
    const { rerender } = render(
      <AgentRunsChart
        {...base}
        data={{ ...shortData, end: start + 5 * 60_000 }}
      />,
    );
    const axisFormat = () =>
      axis.mock.calls.at(-1)![0].formatDate as (date: Date) => string;
    expect(axisFormat()(new Date(start))).toBe("10:00");
    expect(axisFormat()(new Date(start + 5 * 60_000))).toBe("10:05");
    rerender(
      <AgentRunsChart {...base} data={{ ...shortData, end: start + 10_000 }} />,
    );
    expect(axisFormat()(new Date(start + 10_000))).toBe("10:00:10");
    rerender(<AgentRunsChart {...base} />);
    expect(axisFormat()(new Date(base.data.start))).toBe("Oct 28");
  });
  it("keeps a single Tab stop per agent and traverses unsorted sessions in chronological order", () => {
    const base = props();
    const sample = base.data.runs[0];
    const runs = [
      {
        ...sample,
        id: "later",
        trigger: "Later task",
        startedAt: sample.startedAt + 2000,
      },
      { ...sample, id: "earlier", trigger: "Earlier task" },
      { ...sample, id: "other", trigger: "Other agent task", agentId: "emacs" },
    ];
    const data = { ...base.data, runs };
    const { rerender } = render(<AgentRunsChart {...base} data={data} />);
    const buttons = within(
      screen.getByRole("group", { name: "Agent activity" }),
    ).getAllByRole("button");
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(2);
    expect(buttons[0].getAttribute("title")).toContain("Earlier task");
    act(() => buttons[0].focus());
    fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.click(buttons[1]);
    expect(base.onSelect).toHaveBeenCalledExactlyOnceWith("later");
    rerender(<AgentRunsChart {...base} data={data} selectedId="later" />);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(buttons[1], { key: "Home" });
    expect(document.activeElement).toBe(buttons[0]);
  });
});
