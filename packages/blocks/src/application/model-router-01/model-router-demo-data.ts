import type { ModelRouterData } from "./model-router-types";

/** Illustrative snapshot, not a live gateway connection. */
export const modelRouterDemoData: ModelRouterData = {
  environment: { id: "chat-prod", name: "chat-prod" },
  revision: "14",
  policy: { strategy: "balanced", fallback: { enabled: true, from: "opus", to: "gpt" } },
  metrics: { costPer1kTokens: 0.0046, requestsPerSecond: 334, p95Seconds: 1.26, errorRate: 0.005 },
  routes: [
    { id: "opus", name: "Opus 5.5", provider: "Anthropic", brand: "claude", color: "blue", requestsPerSecond: 57, share: 0.17, p50Seconds: 0.84, p95Seconds: 2.16, costPer1kTokens: 0.0126, errorRate: 0.0042 },
    { id: "gpt", name: "GPT-6.1 Sol", provider: "OpenAI", brand: "openai", color: "teal", requestsPerSecond: 140, share: 0.42, p50Seconds: 0.51, p95Seconds: 1.34, costPer1kTokens: 0.0048, errorRate: 0.0027 },
    { id: "haiku", name: "Haiku 4.5", provider: "Anthropic", brand: "claude", color: "purple", requestsPerSecond: 90, share: 0.27, p50Seconds: 0.23, p95Seconds: 0.64, costPer1kTokens: 0.0007, errorRate: 0.0061 },
    { id: "qwen", name: "Qwen3.5 9B", provider: "Self-hosted", brand: "qwen", color: "pink", requestsPerSecond: 47, share: 0.14, p50Seconds: 0.38, p95Seconds: 1.09, costPer1kTokens: 0.0019, errorRate: 0.0108 },
  ],
};
