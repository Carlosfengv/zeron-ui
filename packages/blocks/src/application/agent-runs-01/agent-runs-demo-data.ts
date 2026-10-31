import type { AgentRun, AgentRunsData } from "./agent-runs-types";

/** Deterministic illustrative records; not live model pricing or usage. */
export function createAgentRunsDemoData(zh = false): AgentRunsData {
  const start = Date.parse("2026-10-28T14:00:00+08:00");
  const end = Date.parse("2026-10-31T04:00:00+08:00");
  const prompts = zh
    ? [
        "梳理项目结构与组件依赖",
        "实现项目概览与导航",
        "补充边界状态和交互反馈",
        "对齐图表的主题与坐标轴",
        "检查响应式布局和键盘操作",
        "再看一下费用明细",
        "按照这个设计来改，保留现有组件",
      ]
    : [
        "Map the project structure and component dependencies",
        "Build the project overview and navigation",
        "Add edge states and interaction feedback",
        "Align chart theme and axes",
        "Check responsive layout and keyboard access",
        "Take another look at the cost breakdown",
        "Apply this design using our existing components",
      ];
  const runs: AgentRun[] = [];
  // Cost buckets conserve the reference's agent and model distributions.
  for (let i = 0; i < 88; i += 1) {
    const emacs = i >= 86;
    const modelId = emacs ? "sol" : i >= 72 ? "opus-xhigh" : "opus-high";
    const cents = emacs
      ? 142
      : i >= 72
        ? i === 85
          ? 578
          : i === 84
            ? 169
            : 173
        : i === 71
          ? 219
          : 211;
    const offset =
      i < 56
        ? (i / 55) * 13.5
        : i < 72
          ? 24 + ((i - 56) / 15) * 4
          : i < 78
            ? 49 + ((i - 72) / 5) * 1.2
            : 55.7 + ((i - 78) / 9) * 1.9;
    const duration = (7 + ((i * 7) % 24)) * 60_000;
    const startedAt = start + offset * 3_600_000;
    const cost = cents / 100;
    const inputCost = Math.round(cost * 0.01 * 100) / 100;
    const outputCost = Math.round(cost * 0.35 * 100) / 100;
    const cacheCost = Math.round(cost * 0.43 * 100) / 100;
    const cached = 3_000_000 + ((i * 7919) % 3_000_000);
    runs.push({
      id: `run-${i + 1}`,
      trigger: prompts[i % prompts.length],
      agentId: emacs ? "emacs" : "lambda",
      modelId,
      status: [19, 48, 76].includes(i) ? "cancelled" : "completed",
      startedAt,
      endedAt: startedAt + duration,
      usage: {
        input: { tokens: Math.round(cached / 49), cost: inputCost },
        output: { tokens: 18_000 + i * 317, cost: outputCost },
        cacheRead: { tokens: cached, cost: cacheCost },
        cacheWrite: {
          tokens: 80_000 + i * 827,
          cost:
            Math.round((cost - inputCost - outputCost - cacheCost) * 100) / 100,
        },
      },
      cacheSavings: Math.round(cost * 8.2 * 100) / 100,
    });
  }
  // Pin the most recent completed session to the expanded reference record.
  runs[85] = {
    ...runs[85],
    trigger: zh
      ? "再看一下这个项目的运行记录"
      : "Review the project’s run history",
    startedAt: end - 27 * 60_000,
    endedAt: end - 4 * 60_000,
    usage: {
      input: { tokens: 152, cost: 0 },
      output: { tokens: 102_700, cost: 2.05 },
      cacheRead: { tokens: 12_500_000, cost: 2.49 },
      cacheWrite: { tokens: 247_200, cost: 1.24 },
    },
    cacheSavings: 47.39,
  };
  runs.push({
    id: "run-active",
    trigger: zh
      ? "按照这个设计来改，保留现有组件"
      : "Apply this design using our existing components",
    agentId: "lambda",
    status: "running",
    startedAt: end - 5 * 60_000,
    endedAt: null,
    usage: null,
  });
  return {
    id: "zeron-project-runs",
    project: { name: "Zeron UI · Component library", identifier: "ZER-8317" },
    currency: "USD",
    start,
    end,
    agents: [
      { id: "lambda", name: "Lambda", colorIndex: 1 },
      { id: "emacs", name: "Emacs", colorIndex: 2 },
    ],
    models: [
      { id: "opus-high", name: "Opus 5.5 high", colorIndex: 1 },
      { id: "opus-xhigh", name: "Opus 5.5 xhigh", colorIndex: 2 },
      { id: "sol", name: "GPT-6.1 Sol", colorIndex: 5 },
    ],
    runs,
  };
}
