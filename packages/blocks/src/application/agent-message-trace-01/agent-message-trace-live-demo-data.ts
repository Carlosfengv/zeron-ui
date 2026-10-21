import type {
  AgentMessageTraceData,
  AgentMessageTraceKind,
  AgentMessageTraceSpan,
} from "./agent-message-trace-types";

function span(
  id: string,
  parentId: string | null,
  kind: AgentMessageTraceKind,
  name: string,
  subtitle: string,
  start: number,
  duration: number,
  extra: Partial<AgentMessageTraceSpan> = {},
): AgentMessageTraceSpan {
  return {
    id,
    parentId,
    kind,
    name,
    subtitle,
    startOffsetMs: start * 1000,
    durationMs: duration * 1000,
    status: "success",
    ...extra,
  };
}

/** Video-reference fixture. Usage on every span is exclusive of descendants. */
export const agentMessageTraceLiveDemoData: AgentMessageTraceData = {
  id: "pricing-page-launch",
  messageId: "launch-pricing-by-friday",
  spans: [
    span("orchestrator", null, "agent", "Orchestrator", "Opus 5.5", 0, 82, {
      provider: "Anthropic",
    }),
    span(
      "plan",
      "orchestrator",
      "chat",
      "Plan the launch",
      "Opus 5.5",
      0.9,
      6.9,
      {
        provider: "Anthropic",
        usage: { costUsd: 0.12, inputTokens: 3100, outputTokens: 1000 },
        input: "Launch the new pricing page by Friday",
        output:
          "Research competitor pricing, draft plan copy, and build and test the new pricing page in parallel.",
      },
    ),
    span(
      "researcher",
      "orchestrator",
      "agent",
      "Researcher",
      "Sonnet 5.5",
      8.1,
      30,
      { provider: "Anthropic" },
    ),
    span(
      "linear-search",
      "researcher",
      "tool",
      "web_search",
      "Linear pricing",
      9,
      5.4,
      {
        provider: "Search",
        usage: { costUsd: 0.005 },
        input: "Linear pricing plans and seat limits",
      },
    ),
    span(
      "notion-search",
      "researcher",
      "tool",
      "web_search",
      "Notion pricing",
      9.3,
      7.2,
      {
        provider: "Search",
        usage: { costUsd: 0.005 },
        input: "Notion pricing plans and add-ons",
      },
    ),
    span(
      "query-usage",
      "researcher",
      "tool",
      "Query plan usage",
      "Postgres",
      9.8,
      3.5,
      {
        provider: "Postgres",
        input: "SELECT plan, count(*) FROM subscriptions GROUP BY plan",
      },
    ),
    span(
      "reviews",
      "researcher",
      "tool",
      "Read G2 reviews",
      "120 pages",
      15,
      13,
      {
        provider: "Web",
        usage: { costUsd: 0.02 },
        output:
          "Teams value predictable seat pricing and clear feature limits.",
      },
    ),
    span(
      "summarize",
      "researcher",
      "chat",
      "Summarize findings",
      "Gemini 3.1",
      28.2,
      9.3,
      {
        provider: "Google",
        usage: { costUsd: 0.02, inputTokens: 1700, outputTokens: 700 },
        input: "Competitor pricing, subscription usage, and 120 review pages",
        output:
          "Use three clear plans, show annual savings, and clarify coupon eligibility.",
      },
    ),
    span("writer", "orchestrator", "agent", "Writer", "Sonnet 5.5", 11.4, 37, {
      provider: "Anthropic",
    }),
    span(
      "brand-voice",
      "writer",
      "tool",
      "Read brand voice",
      "Notion",
      12,
      3.6,
      { provider: "Notion" },
    ),
    span(
      "pricing-frames",
      "writer",
      "tool",
      "Read pricing frames",
      "Figma",
      12.4,
      5.1,
      { provider: "Figma" },
    ),
    span("draft", "writer", "chat", "Draft plan copy", "Sonnet 5.5", 18, 23, {
      provider: "Anthropic",
      usage: { costUsd: 0.09, inputTokens: 9800, outputTokens: 4100 },
      input: "Voice guide, research summary, 3 frames with 6 slots each",
      output:
        "Starter for individuals. Team for growing teams. Enterprise for organizations that need advanced controls.",
    }),
    span("save-draft", "writer", "tool", "Save draft", "Notion", 42, 3.6, {
      provider: "Notion",
    }),
    span("coder", "orchestrator", "agent", "Coder", "GPT-6 Sol", 15.6, 62, {
      provider: "OpenAI",
    }),
    span("branch", "coder", "tool", "Create branch", "GitHub", 16.2, 2.1, {
      provider: "GitHub",
      output: "pricing-page-launch",
    }),
    span(
      "write-page",
      "coder",
      "chat",
      "Write pricing page",
      "GPT-6 Sol",
      18.6,
      20,
      {
        provider: "OpenAI",
        usage: { costUsd: 0.16, inputTokens: 34200, outputTokens: 6900 },
      },
    ),
    span("prices", "coder", "tool", "Create prices", "Stripe", 39, 3, {
      provider: "Stripe",
    }),
    span(
      "checkout-failed",
      "coder",
      "tool",
      "Run checkout tests",
      "GitHub",
      43,
      8.4,
      {
        provider: "GitHub",
        status: "error",
        error: {
          message:
            "2 of 14 checkout tests fail – coupon codes aren't applied to seat prices",
          code: "CHECKOUT_COUPON_SEATS",
        },
        input: "pnpm test checkout",
      },
    ),
    span(
      "fix-coupon",
      "coder",
      "chat",
      "Fix coupon handling",
      "GPT-6 Sol",
      52,
      7.8,
      {
        provider: "OpenAI",
        usage: { costUsd: 0.07, inputTokens: 29200, outputTokens: 9000 },
        input:
          "Apply coupon discounts to each seat before calculating the subscription total.",
      },
    ),
    span(
      "checkout-retry",
      "coder",
      "tool",
      "Run checkout tests",
      "retry",
      60.2,
      7.2,
      {
        provider: "GitHub",
        input: "pnpm test checkout",
        output: "14 of 14 checkout tests passed.",
      },
    ),
    span(
      "pull-request",
      "coder",
      "tool",
      "Open pull request",
      "#482",
      68,
      5.4,
      { provider: "GitHub", output: "Pull request #482 opened." },
    ),
    span(
      "update-plans",
      "orchestrator",
      "tool",
      "Update plans",
      "HubSpot",
      74.8,
      3.3,
      { provider: "HubSpot" },
    ),
    span(
      "notify",
      "orchestrator",
      "tool",
      "Notify the team",
      "Slack",
      78.6,
      3.4,
      {
        provider: "Slack",
        input: "The pricing page is ready for review. All checkout tests pass.",
      },
    ),
  ],
};

/** Deterministic playback adapter; the block itself owns no timer or fake stream. */
export function createAgentMessageTraceLiveDemoData(
  nowOffsetMs = 82_000,
): AgentMessageTraceData {
  const now = Math.max(0, Number.isFinite(nowOffsetMs) ? nowOffsetMs : 0);
  return {
    ...agentMessageTraceLiveDemoData,
    spans: agentMessageTraceLiveDemoData.spans
      .filter((item) => item.startOffsetMs <= now)
      .map((item) => {
        const duration = item.durationMs ?? 0;
        if (item.startOffsetMs + duration <= now) return item;
        const progress = duration
          ? Math.min(1, Math.max(0, now - item.startOffsetMs) / duration)
          : 0;
        return {
          ...item,
          status: "running",
          durationMs: undefined,
          error: undefined,
          output: undefined,
          usage: item.usage
            ? {
                costUsd: (item.usage.costUsd ?? 0) * progress,
                inputTokens: Math.round(
                  (item.usage.inputTokens ?? 0) * progress,
                ),
                outputTokens: Math.round(
                  (item.usage.outputTokens ?? 0) * progress,
                ),
              }
            : undefined,
        };
      }),
  };
}
