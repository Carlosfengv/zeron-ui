# ModelDetail02 specification

## Overview

- Target: `packages/blocks/src/application/model-detail-02/model-detail-02.tsx`
- Data: `packages/blocks/src/application/model-detail-02/model-detail-02-data.ts`
- Desktop reference: `docs/design-references/openrouter-gpt-6-astra/desktop-1440.png`
- Mobile reference: `docs/design-references/openrouter-gpt-6-astra/mobile-390.png`
- Interaction model: static content plus click-driven filters, scroll-driven
  local navigation, chart inspection, and an accordion.

## Component contract

`ModelDetail02` accepts a complete `ModelAnalyticsDetailData` object and optional
callbacks for pin, compare, playground, API key, provider, and navigation
actions. The default value is a captured GPT-6 Astra snapshot. The component
must not fetch OpenRouter at runtime.

## DOM structure

1. `PageLayout`
2. Model `PageHeader`
3. `PageSidebar` with section navigation (desktop)
4. `PageContent`
5. `PageContentHeader` with horizontal section navigation (narrow screens)
6. `PageBody`
7. Providers, Pricing, Performance, Uptime, Benchmarks, Apps, Activity, FAQ,
   Explore sections
8. Back-to-top Button

## Zeron components

- Layout: `PageLayout`, `PageHeader`, `PageSidebar`, `PageContent`, `PageBody`,
  `PageSubnav`, `PageSubnavList`, `PageSubnavItem`.
- Surfaces and facts: `Card`, `CardGroup`, `MetricCard`, `InfoItem`, `Badge`.
- Controls: `Button`, `Select`, `Tabs`, `Checkbox`, `Accordion`.
- Data: `Table`.
- Charts: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` with Recharts.
- Existing block: `AvailabilityMonitor` for the complete Uptime section.

No new UI primitive or custom visual variant is permitted.

## Captured content

### Model

- Name: OpenAI: GPT-6 Astra
- Slug: openai/gpt-6-astra
- Description: GPT-6 Astra is OpenAI's flagship model for demanding end-to-end
  work. It is suited for advanced analysis, software engineering, deep research,
  scientific work, and document creation, with particular strengths in
  long-horizon agentic tasks that involve computer and browser use.
- Price: $10 input / $50 output per million tokens.
- Context: 1M summary; FAQ states 1,050,000 and 128,000 max completion tokens.
- Header release: Sep 5, 2026. FAQ release: September 4, 2026. Preserve both
  source strings because the source page is internally inconsistent.

### Providers

Columns: Provider, Input /M, Output /M, Cache read /M, Latency, Throughput,
Uptime. Rows: OpenAI Flex, OpenAI, OpenAI Fast, Azure, Azure (US). Keep the
captured prices, latency, throughput, uptime, and privacy label for all rows.

### Pricing

- Weighted input: $2.401 /M tokens.
- Weighted output: $48.78 /M tokens.
- Sources: Effective, Listed.
- Metrics: Input, Output.
- Ranges: 3D, 1W, 1M, 3M, 1Y, All.
- Provider table: OpenAI, Azure, OpenAI Flex, Azure (US), OpenAI Fast with
  effective/listed in/out, cache-hit rate, and 1d token share.

### Performance

- Throughput: 47 tok/s, P50 best across providers.
- Latency: 2.50 s, P50 best provider.
- Cards: Throughput, Latency, E2E Latency, AutoExacto / GPQA Diamond, Tool Call
  Error Rate, Structured Output Error Rate, Cache Hit Rate.
- Preserve the three visible provider aggregates on each card.

### Uptime

Reuse the existing availability block with its full 72-hour timeline, 24-hour
routed/direct series, endpoints link, and provider-routing link.

### Benchmarks

- Intelligence Index 52.8, better than 97%.
- Coding Index 76.9, better than 96%.
- Agentic Index 51.5, better than 94%.
- Reasoning: GPQA Diamond 96.1%, HLE 54.7%, AA-LCR 80.7%, GDPval-AA 54.0%,
  CritPt 31.7%.
- Coding: SciCode 56.5%.
- Knowledge: AA-Omniscience Accuracy 62.6%, Non-Hallucination Rate 48.7%.
- Source: Artificial Analysis.

### Apps and activity

- Apps: Hermes Agent 50.1B, Codex 44.6B, Cursor 8.97B, omp 8.56B, pi 7.04B,
  with source descriptions and links.
- Activity: Prompt 14B, Completion 63.1M, Reasoning 42.1M and explanatory copy.

### FAQ

Seven source questions and complete source answers must be present. Inline code
terms and the provider-routing link remain semantic.

### Explore

- AI Models with Vision collection.
- AI Model Rankings.
- More models from OpenAI, represented as a deduplicated captured model-card
  list with the original model detail URLs.

## State and accessibility requirements

- Select compound structure remains intact and all values are stable IDs.
- Tabs are controlled and keyboard navigable.
- Tables use real table headers and horizontal overflow is localized.
- Chart legends do not rely on color alone; every series includes a label and
  current aggregate value.
- Icon-only actions include `aria-label`.
- External navigation is expressed as links or a consumer callback.
- Empty data arrays render a short, visible empty state instead of broken
  charts or tables.

## Visual contract

Use Zeron default component recipes and semantic tokens. Layout classes may
control grid columns, gaps, wrapping, sticky placement, and overflow only. Do
not reproduce OpenRouter's palette, font, borders, shadows, or component
internals.

