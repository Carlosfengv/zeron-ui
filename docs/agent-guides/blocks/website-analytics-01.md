---
schema_version: 1
name: website-analytics-01
kind: block
status: stable
locale: zh-CN
summary: 四项网站指标、时间范围、同期趋势对比与页面来源排行的可嵌入分析面板。
package_import: "@zeron/blocks/website-analytics-01"
registry_import: "@/components/blocks/website-analytics-01"
source: packages/blocks/src/application/website-analytics-01/website-analytics.tsx
types: packages/blocks/src/application/website-analytics-01/website-analytics-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [container, metric-card, tabs, checkbox, area-chart, bar-chart, chart-core, chart-primitives]
---

# Website Analytics 01

安装 `npx zeron-ui add website-analytics-01`。React 数据 block，嵌入现有页面并保留宿主布局。下面使用工作区入口，Registry 消费项目使用 `@/components/blocks/website-analytics-01`。

```tsx
"use client";
import { useState } from "react";
import { WebsiteAnalytics, createWebsiteAnalyticsDemoData, websiteAnalyticsLabels, type WebsiteAnalyticsRange } from "@zeron/blocks/website-analytics-01";

export function WebsiteAnalyticsPreview() {
  const [range, setRange] = useState<WebsiteAnalyticsRange>("30d");
  return <WebsiteAnalytics site="example.com" range={range} onRangeChange={setRange} data={createWebsiteAnalyticsDemoData(range)} labels={websiteAnalyticsLabels} locale="zh-CN" timeZone="UTC" />;
}
```

宿主负责真实查询、周期聚合、上一周期对齐及导出。`data.range` 必须与当前 range 一致，旧范围结果不会显示在新范围下。`onRangeChange` 缺失时范围控件禁用。`metric/onMetricChange`、`compare/onCompareChange` 支持受控状态，省略则保留本地交互。`onExport(context)` 接收 range、metric、compare，未传时不显示按钮，`exporting` 提供加载反馈。

metrics 使用 visitors、signups、conversion、bounceRate 四个 key，包含 value/change。计数变化为相对比例（0.117 = 11.7%），率值为 0–1 比例，率的变化为绝对比例差（0.001 = 0.1 个百分点）；跳出率下降显示成功语义。零值有效，null 表示未知。负计数、非有限数值和超出 0–1 的率值按未知处理，趋势保留缺口；无效日期同时从图表和数据表中排除。trend 按真实日期绘制，每点 comparison 已由宿主按相对周期位置对齐；缺失不补零。所有展示日期和 Tooltip 使用 locale/timeZone，默认 en-US/UTC。

pages/sources 使用唯一稳定 id、label、visitors，按访客数降序绘制现有 BarChart，未知值显示 — 并不生成柱形。排行标签位于图表内，读取公共 useChartStable 的分类位置和数值比例尺，与现有 Bar 对齐。文字覆盖柱形的部分使用 fg-on-inverse 反色 token，不随品牌色配置变化；超出短柱形的部分保留普通文字颜色，未知和零值标签仍可见。仅组合业务文字，不重复实现柱形或比例尺。排行禁用 Bar 入场伸展，确保文字反色边界始终与柱形一致；主趋势保留组件默认动画。标签过长时省略并提供完整 title，完整排行通过原生可访问列表保留，图表键盘数据包含 label。指标沿用 MetricCard 公共 leading/footer/onClick API，范围沿用 Tabs segment/default 样式。

趋势主系列和排行沿用图表默认 chart-1 token；同期对比使用 chart-2，图例与 Tooltip 同步对应颜色。主系列保留 Area 默认渐变和透明度。其余颜色使用现有 fg、surface、border、状态 token。图表尺寸基于现有 spacing，布局只使用现有间距工具类。Container 拥有表面，AreaChart/BarChart 拥有图形和键盘交互，ChartDataTable 展示当前指标原始数据。支持加载、空、失败和宿主重试；不同范围旧响应显示加载。窄屏两列指标和上下排行，无额外应用外壳。

示例工厂是固定演示数据：30 天访客 36,686、注册 1,746，转化率由两者计算。示例日曲线、同期数据和来源拆分仅供演示，其他范围来自同一固定序列，不代表真实查询结果。
