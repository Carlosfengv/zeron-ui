export interface ModelFact {
  label: string;
  value: string;
  detail?: string;
  unit?: string;
  presentation?: "modalities";
}

export interface ModelSummary {
  name: string;
  provider: string;
  slug: string;
  description: string;
  facts: readonly ModelFact[];
}

export interface ProviderRecord {
  id: string;
  name: string;
  privacy: "Logs" | "Private";
  inputPrice: number;
  outputPrice: number;
  cacheReadPrice: number;
  latencySeconds: number;
  throughput: number;
  uptime: number;
}

export interface PriceProviderRecord {
  id: string;
  name: string;
  effectiveInput: number;
  effectiveOutput: number;
  listedInput: number;
  listedOutput: number;
  cacheHitRate: number;
  tokenShare: number;
}

export interface ChartPoint {
  date: string;
  [series: string]: string | number;
}

export interface PricingData {
  weightedInput: number;
  weightedOutput: number;
  providers: readonly PriceProviderRecord[];
  effectiveInput: readonly ChartPoint[];
  effectiveOutput: readonly ChartPoint[];
  listedInput: readonly ChartPoint[];
  listedOutput: readonly ChartPoint[];
}

export interface PerformanceSeries {
  key: string;
  label: string;
  average: string;
}

export interface PerformanceChart {
  id: string;
  title: string;
  kind: "line" | "benchmark";
  data: readonly ChartPoint[];
  series: readonly PerformanceSeries[];
}

export interface BenchmarkIndex {
  id: string;
  value: number;
  label: string;
  percentile: number;
}

export interface BenchmarkMetric {
  id: string;
  label: string;
  description: string;
  value: number;
}

export interface BenchmarkGroup {
  id: string;
  label: string;
  metrics: readonly BenchmarkMetric[];
}

export interface AppTrafficRecord {
  id: string;
  rank: number;
  name: string;
  description: string;
  tokens: number;
}

export interface ActivityRecord {
  date: string;
  prompt: number;
  completion: number;
  reasoning: number;
}

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
}

export interface ModelAnalyticsDetailData {
  capturedAt: string;
  model: ModelSummary;
  providers: readonly ProviderRecord[];
  pricing: PricingData;
  performance: {
    throughput: number;
    latencySeconds: number;
    charts: readonly PerformanceChart[];
  };
  uptime: {
    uptime: number;
    availability: number;
    routedAvailability: number;
    directAvailability: number;
    rangeLabel: string;
  };
  benchmarkIndexes: readonly BenchmarkIndex[];
  benchmarkGroups: readonly BenchmarkGroup[];
  apps: readonly AppTrafficRecord[];
  appActivity: readonly ChartPoint[];
  activity: readonly ActivityRecord[];
  faqs: readonly FaqRecord[];
}

const OPENAI = "openai";
const OPENAI_FLEX = "openai-flex";
const OPENAI_FAST = "openai-fast";
const AZURE = "azure";
const AZURE_US = "azure-us";

const priceDates = ["Sep 4", "Sep 5", "Sep 6", "Sep 7", "Sep 8"] as const;

function points(rows: readonly (readonly number[])[]): readonly ChartPoint[] {
  return rows.map((values, index) => ({
    date: priceDates[index] ?? String(index + 1),
    [OPENAI]: values[0] ?? 0,
    [AZURE]: values[1] ?? 0,
    [OPENAI_FLEX]: values[2] ?? 0,
    [AZURE_US]: values[3] ?? 0,
    [OPENAI_FAST]: values[4] ?? 0,
  }));
}

const providers: readonly ProviderRecord[] = [
  { id: OPENAI_FLEX, name: "OpenAI Flex", privacy: "Logs", inputPrice: 5, outputPrice: 25, cacheReadPrice: 0.5, latencySeconds: 3.95, throughput: 48, uptime: 100 },
  { id: OPENAI, name: "OpenAI", privacy: "Logs", inputPrice: 10, outputPrice: 50, cacheReadPrice: 1, latencySeconds: 3.67, throughput: 27, uptime: 98.98 },
  { id: OPENAI_FAST, name: "OpenAI Fast", privacy: "Logs", inputPrice: 20, outputPrice: 100, cacheReadPrice: 2, latencySeconds: 2.49, throughput: 36, uptime: 100 },
  { id: AZURE, name: "Azure", privacy: "Private", inputPrice: 10, outputPrice: 50, cacheReadPrice: 1, latencySeconds: 5.25, throughput: 17, uptime: 88.49 },
  { id: AZURE_US, name: "Azure (US)", privacy: "Private", inputPrice: 11, outputPrice: 55, cacheReadPrice: 1.1, latencySeconds: 5.84, throughput: 19, uptime: 92.32 },
];

const pricingProviders: readonly PriceProviderRecord[] = [
  { id: OPENAI, name: "OpenAI", effectiveInput: 2.255, effectiveOutput: 51.81, listedInput: 10, listedOutput: 50, cacheHitRate: 92.43, tokenShare: 49.16 },
  { id: AZURE, name: "Azure", effectiveInput: 3.247, effectiveOutput: 50.51, listedInput: 10, listedOutput: 50, cacheHitRate: 82.56, tokenShare: 23.05 },
  { id: OPENAI_FLEX, name: "OpenAI Flex", effectiveInput: 1.159, effectiveOutput: 27.36, listedInput: 5, listedOutput: 25, cacheHitRate: 91.37, tokenShare: 19.31 },
  { id: AZURE_US, name: "Azure (US)", effectiveInput: 3.973, effectiveOutput: 55.39, listedInput: 11, listedOutput: 55, cacheHitRate: 78.7, tokenShare: 7.25 },
  { id: OPENAI_FAST, name: "OpenAI Fast", effectiveInput: 3.161, effectiveOutput: 100, listedInput: 20, listedOutput: 100, cacheHitRate: 94.47, tokenShare: 0.46 },
];

const performanceSeries = [
  { key: OPENAI, label: "OpenAI" },
  { key: OPENAI_FLEX, label: "OpenAI Flex" },
  { key: OPENAI_FAST, label: "OpenAI Fast" },
  { key: AZURE, label: "Azure" },
  { key: AZURE_US, label: "Azure (US)" },
] as const;

function performanceChart(
  id: string,
  title: string,
  rows: readonly (readonly number[])[],
  averages: Readonly<Record<string, string>>,
): PerformanceChart {
  return {
    id,
    title,
    kind: "line",
    data: points(rows),
    series: performanceSeries
      .filter(({ key }) => averages[key])
      .map(({ key, label }) => ({ key, label, average: averages[key] ?? "" })),
  };
}

export const defaultModelAnalyticsDetail: ModelAnalyticsDetailData = {
  capturedAt: "2026-09-08T11:00:00+08:00",
  model: {
    name: "OpenAI: GPT-6 Astra",
    provider: "OpenAI",
    slug: "openai/gpt-6-astra",
    description: "GPT-6 Astra is OpenAI's flagship model for demanding end-to-end work. It is suited for advanced analysis, software engineering, deep research, scientific work, and document creation, with particular strengths in long-horizon agentic tasks that involve computer and browser use.",
    facts: [
      { label: "Modalities", value: "Files, images, text → text", presentation: "modalities" },
      { label: "In / out price", value: "$10 / $50", unit: "per 1M" },
      { label: "Context", value: "1M", detail: "1,050,000 tokens" },
      { label: "Released", value: "Sep 5, 2026" },
    ],
  },
  providers,
  pricing: {
    weightedInput: 2.400673,
    weightedOutput: 48.78,
    providers: pricingProviders,
    effectiveInput: points([
      [2.3949, 2.3765, 1.982, 1.7674, 3.7419],
      [2.3121, 2.351, 1.3115, 2.5943, 3.0144],
      [2.5137, 2.7416, 1.1164, 3.0244, 4.1553],
      [2.4914, 3.0857, 1.1097, 3.4561, 3.6866],
      [2.2548, 3.247, 1.1595, 3.9732, 3.1614],
    ]),
    effectiveOutput: points([
      [50.7331, 51.1992, 25.31, 55.1068, 100.7002],
      [51.9507, 50.7268, 27.0934, 57.195, 100.9096],
      [52.0346, 51.358, 27.5887, 56.4896, 107.7545],
      [51.8648, 51.232, 26.4624, 55.8102, 102.65],
      [51.8132, 50.512, 27.3648, 55.3902, 100],
    ]),
    listedInput: points(Array.from({ length: 5 }, () => [10, 10, 5, 11, 20])),
    listedOutput: points(Array.from({ length: 5 }, () => [50, 50, 25, 55, 100])),
  },
  performance: {
    throughput: 47,
    latencySeconds: 2.5,
    charts: [
      performanceChart("throughput", "Throughput", [
        [34, 47, 51, 39, 31], [35, 36, 53, 34, 42], [33, 15, 50, 23, 50], [28, 17, 41, 15, 50], [30, 16.5, 47, 17, 33],
      ], { [OPENAI_FLEX]: "48 tok/s", [OPENAI_FAST]: "39 tok/s", [OPENAI]: "32 tok/s" }),
      performanceChart("latency", "Latency", [
        [4.003, 4.702, 3.636, 3.435, 2.4], [3.55, 5.188, 4.264, 5.985, 3.316], [4.036, 6.382, 4.007, 7.41, 3.172], [4.406, 5.594, 4.785, 5.681, 2.963], [4.338, 5.142, 3.85, 5.34, 4.42],
      ], { [OPENAI]: "4.02 s", [OPENAI_FAST]: "4.09 s", [OPENAI_FLEX]: "4.09 s" }),
      performanceChart("e2e", "E2E Latency", [
        [10.575, 12.194, 9.77, 10.983, 6.425], [9.336, 13.526, 12.155, 14.864, 8.674], [10.821, 15.765, 11.108, 18.462, 8.555], [12.741, 13.329, 12.245, 13.19, 8.235], [11.538, 12.557, 10.163, 13.081, 10.873],
      ], { [OPENAI_FAST]: "9.95 s", [OPENAI]: "11.00 s", [OPENAI_FLEX]: "11.06 s" }),
      {
        id: "autoexacto",
        title: "AutoExacto Benchmarks",
        kind: "benchmark",
        data: [],
        series: [
          { key: OPENAI, label: "OpenAI", average: "94.6%" },
          { key: AZURE_US, label: "Azure (US)", average: "94.6%" },
          { key: AZURE, label: "Azure", average: "94.2%" },
        ],
      },
      performanceChart("tool-errors", "Tool Call Error Rate", [
        [3.59, 1.36, 25.09, 1.17, 13.54], [4.87, 1.45, 43.64, 0.17, 18.79], [9.55, 0.09, 43.95, 0.04, 11.24], [8.33, 0.46, 32.6, 0.28, 35.39], [13.07, 0.04, 56.5, 0.31, 0],
      ], { [AZURE_US]: "0.39%", [AZURE]: "0.68%", [OPENAI]: "7.88%" }),
      performanceChart("structured-errors", "Structured Output Error Rate", [
        [1.2, 8.17, 14.29, 10.71, 16.67], [1.47, 7.08, 1.11, 1.32, 0.29], [1.7, 1.22, 0, 3.55, 0.44], [2.29, 1.53, 0.79, 1.75, 0.51], [1.47, 0, 0, 0, 0],
      ], { [OPENAI]: "1.63%", [OPENAI_FLEX]: "3.24%", [AZURE_US]: "3.47%" }),
      performanceChart("cache-hit", "Cache Hit Rate", [
        [90.46, 90.14, 84.35, 94.99, 94.15], [92.07, 90.36, 91.66, 92.59, 95.8], [91.16, 89.32, 93.84, 89.49, 93.95], [91.31, 86.51, 93.27, 84.79, 92.72], [92.5, 82.7, 91.56, 79.01, 88.73],
      ], { [OPENAI]: "91.47%", [OPENAI_FLEX]: "90.92%", [AZURE_US]: "87.66%" }),
    ],
  },
  uptime: {
    uptime: 100,
    availability: 99.35,
    routedAvailability: 99.85,
    directAvailability: 95.07,
    rangeLabel: "Sep 5, 11 AM - Sep 8, 11 AM",
  },
  benchmarkIndexes: [
    { id: "intelligence", value: 52.8, label: "Artificial Analysis Intelligence Index", percentile: 97 },
    { id: "coding", value: 76.9, label: "Artificial Analysis Coding Index", percentile: 96 },
    { id: "agentic", value: 51.5, label: "Artificial Analysis Agentic Index", percentile: 94 },
  ],
  benchmarkGroups: [
    { id: "reasoning", label: "Reasoning", metrics: [
      { id: "gpqa", label: "GPQA Diamond", description: "Graduate-level scientific reasoning", value: 96.1 },
      { id: "hle", label: "HLE", description: "Humanity's Last Exam", value: 54.7 },
      { id: "aa-lcr", label: "AA-LCR", description: "Long context reasoning evaluation", value: 80.7 },
      { id: "gdpval", label: "GDPval-AA", description: "Economically valuable tasks", value: 54 },
      { id: "critpt", label: "CritPt", description: "Research-level physics reasoning", value: 31.7 },
    ] },
    { id: "coding", label: "Coding", metrics: [
      { id: "scicode", label: "SciCode", description: "Python programming for scientific computing", value: 56.5 },
    ] },
    { id: "knowledge", label: "Knowledge", metrics: [
      { id: "omniscience", label: "AA-Omniscience Accuracy", description: "Proportion of correctly answered questions", value: 62.6 },
      { id: "non-hallucination", label: "AA-Omniscience Non-Hallucination Rate", description: "Rate of avoiding hallucination among non-correct responses", value: 48.7 },
    ] },
  ],
  apps: [
    { id: "hermes-agent", rank: 1, name: "Hermes Agent", description: "Hermes Agent is an open-source, self-improving AI agent by Nous Research that runs persistently with memory across sessions, and builds reusable skills from experience. It comes with 40+ built-in tools, including web search, browser automation, and vision, plus scheduled automations and subagents.", tokens: 50137548151 },
    { id: "codex", rank: 2, name: "Codex", description: "A coding agent that helps you build and ship with AI", tokens: 44564041207 },
    { id: "cursor", rank: 3, name: "Cursor", description: "new", tokens: 8966654575 },
    { id: "omp", rank: 4, name: "omp", description: "new", tokens: 8555707631 },
    { id: "pi", rank: 5, name: "pi", description: "There are many coding agents, but this one is yours.", tokens: 7043230753 },
  ],
  appActivity: [
    { date: "Sep 4", hermes: 2.1, codex: 1.3, other: 0.5 },
    { date: "Sep 5", hermes: 38.2, codex: 28.4, other: 24.1 },
    { date: "Sep 6", hermes: 33.4, codex: 25.7, other: 27.2 },
    { date: "Sep 7", hermes: 42.3, codex: 31.2, other: 35.5 },
    { date: "Sep 8", hermes: 7.1, codex: 5.2, other: 46.8 },
  ],
  activity: [
    { date: "Sep 4", prompt: 3817161693, completion: 63299739, reasoning: 28170907 },
    { date: "Sep 5", prompt: 70264983574, completion: 594025266, reasoning: 210949600 },
    { date: "Sep 6", prompt: 62649184320, completion: 504744181, reasoning: 183762101 },
    { date: "Sep 7", prompt: 86568824343, completion: 710478277, reasoning: 271229395 },
    { date: "Sep 8", prompt: 13984932215, completion: 105192792, reasoning: 42136892 },
  ],
  faqs: [
    { id: "what-is", question: "What is GPT-6 Astra?", answer: "GPT-6 Astra is OpenAI's flagship model for demanding end-to-end work. It is suited for advanced analysis, software engineering, deep research, scientific work, and document creation, with particular strengths in long-horizon agentic tasks that involve computer and browser use." },
    { id: "cost", question: "How much does GPT-6 Astra cost?", answer: "GPT-6 Astra costs $10.00/M input tokens and $50.00/M output tokens, with separate rates for Cache Read at $1.00/M tokens, Cache Write at $12.50/M tokens and Web Search at $10.00/1K calls." },
    { id: "context", question: "What is the context length of GPT-6 Astra?", answer: "GPT-6 Astra has a 1,050,000 token context window. It supports up to 128,000 completion tokens." },
    { id: "tools", question: "Does GPT-6 Astra support tool calling and structured outputs?", answer: "Yes. GPT-6 Astra accepts tools and tool_choice for function calling. It also supports structured outputs via a JSON schema in response_format." },
    { id: "modalities", question: "What inputs and outputs does GPT-6 Astra support?", answer: "GPT-6 Astra accepts files such as PDFs, images and text as input and returns text." },
    { id: "providers", question: "Which providers serve GPT-6 Astra?", answer: "GPT-6 Astra is served by 2 providers on OpenRouter: OpenAI and Azure (US). Requests are routed to the best available provider, with automatic failover to the others, and you can pin or exclude providers with provider routing." },
    { id: "released", question: "When was GPT-6 Astra released?", answer: "GPT-6 Astra was released on September 4, 2026." },
  ],
};
