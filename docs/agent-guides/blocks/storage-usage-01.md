---
schema_version: 1
name: storage-usage-01
kind: block
status: stable
summary: 以 text-label 为尺寸基准展示存储用量、分类分段和剩余容量。
registry_import: "@/components/blocks/storage-usage-01"
source: packages/blocks/src/application/storage-usage-01/storage-usage.tsx
registry: packages/blocks/registry.json
related:
  - metric-card
  - badge
---

# Storage Usage 01

Use this embedded block for storage or quota summaries. It does not create a page shell.

```tsx
import { StorageUsage, storageUsageDemoData } from "@/components/blocks/storage-usage-01";

<StorageUsage data={storageUsageDemoData} />
```

- `data.capacity` and each item `value` share the chosen `unit` (default GB). Items have stable, unique IDs, labels and a public `BadgeColor`.
- Used capacity is derived from category values. Negative and nonfinite inputs normalize to zero. Never pass a separate inconsistent total.
- Empty items show 0% and an empty track. Zero capacity with positive usage shows an unknown percentage. Over-capacity usage keeps its actual percentage; category proportions fit the filled track and remaining capacity is zero.
- The reference's category labels do not sum to its summary; the demo preserves 94% of 20 GB with consistent, proportional category values. These are example data, not a backend integration.
- `locale`, `unit`, and full-sentence `formatters` support localization. `state`, `statusMessage`, `onClick`, and `actionLabel` are inherited from MetricCard.
- The block uses MetricCard's public split layout, description, label/value class names and footer. Colors come from `badgeColors`; do not add raw colors or use descendant selectors to restyle MetricCard.
- Label text uses `text-label`; titles derive from `--font-size-label` at 4/3 scale. Padding is 16px, the continuous bar is 12px tall, and the legend wraps.
- Loading and unavailable/error states hide numeric descriptions and the distribution. Stale data remains visible with its supplied status message.

MetricCard's `layout="split"` is optional. Its default `stacked` layout remains unchanged; `description` adds label context, and `valueClassName` is a public typography hook.
