# GPT-6 Astra model page topology

Source: `https://openrouter.ai/openai/gpt-6-astra`

Captured: 2026-09-08, Asia/Shanghai.

## Scope

The implementation reproduces the source page's business content, data hierarchy,
links, and local interactions with Zeron components and semantic tokens. It does
not reproduce OpenRouter's visual system.

Excluded source regions:

- global OpenRouter navigation and search;
- the compact global sticky model toolbar;
- global OpenRouter footer and social links.

Included flow content, in order:

1. Model identity, slug, description, actions, modalities, price, context, release.
2. Local section navigation.
3. Providers.
4. Pricing.
5. Performance.
6. Uptime.
7. Benchmarks.
8. Apps.
9. Activity.
10. Frequently asked questions.
11. Explore more models and more models from OpenAI.
12. Back-to-top action.

## Layout ownership

- `PageLayout` owns the page gutter and local sidebar/content relationship.
- `PageSidebar` owns the desktop section navigation track.
- `PageContent` and `PageBody` own the main surface and vertical scrolling.
- A horizontal `PageSubnav` is used below the desktop sidebar breakpoint.
- Ordinary sections own local grids and responsive wrapping.
- Cards are used only for cohesive metric, chart, ranking, and related-model
  surfaces.

## Data boundary

The registry demo ships a captured data snapshot. All data is exposed through a
single `ModelAnalyticsDetailData` prop so a consumer can replace it with a live
adapter. No OpenRouter endpoint is called by the installed block.

