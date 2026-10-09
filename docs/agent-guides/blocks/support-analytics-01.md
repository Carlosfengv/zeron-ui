---
schema_version: 1
name: support-analytics-01
kind: block
status: stable
summary: 工单趋势、渠道筛选、服务指标与最近工单处理的嵌入式分析面板。
registry_import: "@/components/blocks/support-analytics-01"
source: packages/blocks/src/application/support-analytics-01/support-analytics.tsx
types: packages/blocks/src/application/support-analytics-01/support-analytics-types.ts
registry: packages/blocks/registry.json
related: [security-overview-01, project-monitor-01, deployment-detail-01, model-router-01, bar-chart, line-chart, chart-core, container]
---

# 客服工单分析

React 数据 block，不创建应用外壳。默认最大宽度 576px，Container 提供外框与三个浮动内容区，状态 Tabs 直接放在框架上。默认中文、zh-CN、Asia/Shanghai；labels、locale、timeZone 可覆盖。

```tsx
import { useState } from "react";
import { SupportAnalytics, createSupportAnalyticsDemoData, type SupportAnalyticsQuery } from "@/components/blocks/support-analytics-01";
export function SupportPreview() {
  const [query, setQuery] = useState<SupportAnalyticsQuery>({ range: "this-week", channel: "all" });
  return <SupportAnalytics scopeId="support-demo" data={createSupportAnalyticsDemoData(query)} {...query} onRangeChange={(range) => setQuery({ ...query, range })} onChannelChange={(channel) => setQuery({ ...query, channel })} />;
}
```

## 数据与查询

scopeId/range/channel 必须匹配快照。范围和渠道受控，由宿主加载与更新 data，使用请求序号或 AbortController 丢弃旧响应。新查询不能显示旧数据。view/defaultView/onViewChange、ticketsExpanded/defaultTicketsExpanded/onTicketsExpandedChange 支持受控和本地模式。scope 切换重置本地选择；范围/渠道变化保留状态视图与展开选择，隔离旧操作反馈。

统计总体为窗口内创建的工单，当前 open/resolved 互斥。完整总量等于分类计数和创建分桶之和。时间窗口左闭右开，UTC 毫秒，bucketMs 表示等长分桶；observedThrough 明确观测截止。只有完整连续且全非负整数的分桶才计算平均线，线使用原值，标签舍入。零有效，null 未知，未来未观测分桶不可补零。非法窗口不绘图，不完整趋势注明平均不可用。服务端总量可独立提供。

指标时长使用毫秒、比例 0..1，包含真实 sampleSize/aggregation/target/improvementDirection/comparison；不平均日均值或比例。比例差异以百分点显示；前期零值不产生无限环比。All 的首次回复/解决/首次解决率、Open 的首次回复/等待/SLA 超时、Resolved 的首次回复/解决/重开率由 views 分别提供；缺视图显示局部加载。四条 recentTickets 是预览，不代表全局总量，宿主按创建时间降序及稳定 ID 排序。

updatedAt 仅来自快照；不传 now 则显示绝对日期，传 now 才显示相对时间。

## 动作与状态

ready/loading/stale/error；refreshing 独立。同查询的刷新失败需显式 retainDataOnError 才保留快照并提示。首次失败使用 Alert，可 onRetry。确认零工单传 total=0 和空列表，不用 null 冒充零。

actions 提供刷新、重试、导出、队列、详情与解决工单，缺能力隐藏入口。回调收到点击时 scope/snapshot/revision/range/channel/view，工单操作再带 ticketId。组件等待 Promise、独立防重复并显示 labels.actionError；查询、快照 ID 或 revision 改变时清除旧反馈和等待状态，旧操作完成不覆盖新操作状态。宿主确认新快照后更新状态；组件不会仅因 Promise 完成伪造 resolved。工单解决不改变创建量，只更新状态计数、相关列表和实际服务聚合。实际请求的取消与结果写入仍由宿主负责。

demo 从完整固定工单集合重算分桶、计数及指标；包含状态演示、失败重试、详情/队列 Dialog、JSON 下载和局部 ToastStack。下载标记 demonstration=true。没有生产查询、权限或持久化集成。

## 组件与样式

复用 Container/Header/Body/Footer、Select、Tabs、MetricCard、Chart、ChartDataTable、Table、Accordion、Avatar、InfoItem、Badge、Dropdown/MenuItem、Button、Tooltip、Empty、Alert、InlineNotice、Skeleton。柱图和短趋势使用当前 Zeron BarChart / LineChart，与 chart-core 的 Tooltip 和 ReferenceLine 组合；不另写 SVG 交互或补点满足 MetricCard 的 24 点要求。指标当前值、目标与前期值使用同一单位域校验；非法比例不计算环比。短趋势按真实时间间隔绘制，无效数值保留断点，无效时间不绘制，原始数据仍可通过数据表查阅。

柱图保留 demo 的竖向渐变结构，按用户后续要求使用当前主题 brand 色并向底部淡出到透明、顶部圆角和紧凑柱间距。平均值的 strong Badge 使用 inverse-background/fg-on-inverse 公共色变量，作为 ReferenceLine 的公开 label 放在虚线左端；均线位置使用未舍入值，标签只格式化显示。渐变 ID 按实例独立。7 日显示星期，30 日显示日期，12 周按统计窗口显示 W1–W12，Tooltip 和数据表保留真实日期。不完整数据不画平均线；零值仍显示平均 0。图表高度和圆角使用 Zeron Chart 的公开几何参数，UI 与全局样式保持原组件实现。

渠道通过 Badge 筛选：共享的 strong Badge 高亮层使用当前主题的 brand/fg-on-brand 变量，在渠道间滑动；其他项使用默认 solid/gray。选中文字通过 Badge 公开自定义色接口与高亮层配对。每个 block 的高亮标识独立，沿用 Tabs 的 spring.moderate 动效；移动高亮使用变换，不伸缩可见文字。Badge 使用公开 role、tabIndex、aria-pressed 与事件参数支持点击、Enter 和空格，不保留渠道 TabPanel。总量通过 MetricCard 的公开 value 内容从当前显示值递增或递减到新值，使用无回弹的两倍 spring.slow 时长；快速切换从中间值继续过渡，初次显示和未知值立即呈现。屏幕阅读器读取真实目标数值，减少动画偏好下立即显示新数值并关闭滑动；不延迟筛选或数据更新。状态仍为 pill/default，通过 TabItem 的公开 badge 参数将未解决数量设为 strong/red、已解决数量设为 strong/green；未知数量保留默认灰色。状态栏不使用 ContainerBody 的浮动表面包裹；Accordion 保留默认箭头，Tooltip 保留公共浮动样式，完成反馈使用现有 Toast。所有 UI 色值/字号/边界沿用 tokens，图形尺寸是业务可视化几何。图表关闭增长动画，主图和小趋势提供键盘数据表。窄容器只在渠道 Badge 栏、状态 TabsList 与 Table 内横向滚动，焦点使用原生 scrollIntoView 保持可见，不添加整体固定高度。
