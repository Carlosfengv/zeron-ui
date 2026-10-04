---
schema_version: 1
name: metric-card
kind: component
status: stable
locale: zh-CN
summary: 展示有单位、口径与数据状态的指标，可选明细或基于真实样本的微型图表。
package_import: "@zeron/ui/metric-card"
registry_import: "@/components/ui/metric-card"
source: packages/ui/src/components/metric-card.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [chart, skeleton, status-overview]
---

# MetricCard

## 选型与数据口径

用于 KPI、统计值和短趋势；大量原始记录用表格，完整分析图用 Chart。先确定指标名称、单位、统计周期、样本范围和更新时刻，不凭视觉样式改变聚合口径。

## 公共契约

- `label` 与 `value` 必需；`unit` 与数值分开，`meta` 说明周期／更新时间，description／footer 提供其他上下文。
- `layout` 为 stacked／split，`tone` 为 default／positive／warning／critical。上升不一定是好事，依据业务含义选 tone。
- `state` 为 ready、loading、unavailable、stale、error；使用 `statusMessage` 解释不可用、过期或失败。
- `content` 为 none、breakdown 或 visualization。breakdown 支持 list／grid 和带标签、值、tone 的项目。
- visualization 的 chart 为 line／area／bar，data 为数字或 `{ value, label? }`。至少 24 个有限样本，需可访问说明 `accessibleLabel`；`formatValue` 处理检查值的格式。
- `onClick` 是整卡动作，配 `actionLabel`；`action` 为独立操作区域。整卡可点击时微图表不作为另一组独立交互。不要叠加透明覆盖层或嵌套自制按钮。
- loading 会关闭整卡动作；其他状态是否允许导航仍由调用者决定，不能假设 error 自动禁用所有业务行为。

## 零值与缺失值

```tsx
import { MetricCard, type MetricCardState } from "@zeron/ui/metric-card";
export function RequestMetric({ value, state, updatedAt, canViewDetails, onOpen }: {
  value: number | null; state: MetricCardState; updatedAt: string;
  canViewDetails: boolean; onOpen: () => void;
}) {
  const valid = value !== null && Number.isFinite(value);
  const displayState = state === "ready" && !valid ? "unavailable" : state;
  return <MetricCard label="请求数" value={valid ? value.toLocaleString("zh-CN") : "—"}
    unit="次" meta={`更新时间：${updatedAt}`} state={displayState}
    statusMessage={displayState === "error" ? "指标读取失败" : "暂无可用指标"}
    onClick={canViewDetails && (displayState === "ready" || displayState === "stale") ? onOpen : undefined}
    actionLabel="查看请求明细" content={{ type: "none" }} />;
}
```

## 加载、趋势与权限

0 是有效测量值，null、NaN 和 Infinity 不是；不要用 `value || "—"`。有旧数据但读取失败时明确决定 stale 或 error，不把旧值标为新鲜结果。

样本不足、日期缺失或单位不一致时不给微图表伪造 24 个点。系列采样、排序与缺失处理属于数据适配层；此卡不是时间聚合或自动补点引擎。保留真实 tooltip 标签与值，格式化不能改变底层测量值。

## 验收

检查零值、负值、极大数、loading／error／stale、真实单位、明细权限、键盘整卡操作、微图表方向键与样本不足反馈，并查看窄屏。示例类型由 `agents:guides:examples:check` 验证；不证明指标接口、聚合结果或图表交互已经验收。消费者以已安装源码和实际 aliases 为准。
