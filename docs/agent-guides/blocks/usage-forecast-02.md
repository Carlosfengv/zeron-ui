---
schema_version: 1
name: usage-forecast-02
kind: block
status: stable
summary: 单周期预算用量预测，涵盖预计超额、预算内和已超额三种场景、预测区间与告警阈值。
registry_import: "@/components/blocks/usage-forecast-02"
source: packages/blocks/src/application/usage-forecast-02/usage-budget-forecast.tsx
types: packages/blocks/src/application/usage-forecast-02/usage-budget-forecast-types.ts
registry: packages/blocks/registry.json
related: [container, tabs, button, icon-context, line-chart, area-chart, chart-core, chart-primitives]
---

# 预算用量预测

React data-block，导出 `UsageBudgetForecast`，不创建应用外壳。用于一个组织、一个计费周期中多个资源指标的预算预测。区别于 `usage-forecast-01` 的多账户额度耗尽与重置时间线。

```tsx
import { UsageBudgetForecast, usageBudgetForecastDemoData } from "@/components/blocks/usage-forecast-02";

export function BudgetOverview() {
  return <UsageBudgetForecast data={usageBudgetForecastDemoData} />;
}
```

data 提供 organization、plan、periodStart、periodEnd、renewsAt、now 和 metrics；日期是 UTC 计费日的 epoch 毫秒，显示日期统一按 UTC 格式化，不受浏览器时区影响。每个指标的 id 必须唯一非空；budget 为正有限数；unit 是展示单位，API 示例的数值单位为百万（M），不是原始调用次数；fractionDigits 为 0–6 整数。history 和 forecast 必须按时间严格递增，数值非负有限；历史最后一点和预测第一点必须都位于 now 且数值相同，预测最后一点位于 periodEnd。每个预测点满足 0 <= lower <= value <= upper。domain / ticks 可选，显式 domain 须包含预算、历史及区间边界。不完整数据不会被补成零；非法输入显示错误。

三种结论根据当前用量和未来预算交点推导；历史达到后回落到预算内时，主结论恢复为未来预测，告警项仍保留历史达到日期。交点按相邻采样间线性插值，仅将从下方穿越阈值或首个观测恰好等于阈值视为已知交点；第一条观测已经超额时使用“从该日起已达到或超过”的标题，不推断更早的达到日期。周期开始时已超过 80% 的指标不绘制虚假的新交点。当前预算百分比向下取整；恰好达到预算与不足 1% 的超额分别表达。预测区间是宿主给定范围，不宣称统计置信度；下界未触及预算时，说明仍可能保持预算内，不将周期结束日当作最晚交点。提前天数按 UTC 日历日计算。50 / 80 / 100 阈值分别展示周期开始已达到、历史已达到、预计达到或预计不会触及。

overage 是独立计费报价：amount、currency（ISO 三位代码）、rate 和 per。示例保留截图 $1,449 / $0 / $292；这些金额与已舍入的终值乘费率不完全一致，不能作为真实计费计算。报价保留小数与低于一美分的费率，不强制取整；宿主应提供正式报价。API 的 rate / per 表示每 1000 次调用 $0.20，与图上 M 单位分开理解。

metricId / defaultMetricId / onMetricChange 控制指标选择；失效 ID 回退到首项。alerts / defaultAlerts 是以 metric.id 为键的阈值数组映射，默认启用 80、100；onAlertsChange(metricId, thresholds) 返回当前指标按升序排列的设置。告警阈值复用 tertiary Button，整项点击或 Enter / Space 切换；active 与 aria-pressed 表达开关状态，启用时通过 leadingIcon 显示公开 check 图标，日期状态通过可见文案及 aria-description 提供。受控属性存在时回调不会更改界面状态；宿主更新属性后生效。每个指标的本地设置在切换后保留，重挂载不持久化，不发送通知。

指标 Tabs 使用 variant="pill" / color="default"。图表复用当前原生 AreaChart、Line、Area、Grid、XAxis、YAxis、ChartTooltip、TooltipContent。公开 Area stackId 组合透明 lower、预算内区间及超额区间，准确绘制浮动范围。原生堆叠包含零基线，绘图坐标减去 domain 下界；坐标轴、标注、Tooltip 与每日数据表显示原始数值，不改变输入数据或单位。AreaChart.accessibleData 提供本地化的原始观测，辅助技术不读取内部偏移值或插值点。实际为实线、预测为虚线；预算内为语义前景色，超额为 fg-danger，区间使用相同颜色的低透明度。预算交点及上下界交点插入精确采样，避免在相邻点错误着色。少量 SVG 仅作业务标注，使用公开 useChartStable 坐标。可展开 ChartDataTable 保留原始每日值，不展示内部插值辅助点。

labels 可覆盖全部业务文案；提供 usageBudgetForecastEnLabels / usageBudgetForecastZhLabels；指标名、单位、组织和套餐由 data 提供。locale 无效时回退 en-US。支持 state=ready/loading/error、空 metrics、errorMessage/onRetry。Container 管理表面，普通语义 dl 管理三项指标，使用容器查询窄屏纵向布局，不覆盖组件内部样式或增加全局样式。指标排版与 MetricCard 默认 stacked 版一致：标签 text-body，数值 text-heading / font-semibold，单位 text-body / font-medium，辅助说明 text-label。区块标题与预测结论使用 text-body / font-medium，组织信息与预测说明使用 text-label。

固定 mock 为 2026-09-22；真实预测服务、通知、报价、权限和持久化均由宿主接入。
