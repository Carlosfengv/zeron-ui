---
schema_version: 1
name: project-monitor-01
kind: block
status: stable
summary: 中文项目监控卡片，展示资源、存储、服务活动与请求报告。
registry_import: "@/components/blocks/project-monitor-01"
source: packages/blocks/src/application/project-monitor-01/project-monitor.tsx
types: packages/blocks/src/application/project-monitor-01/project-monitor-types.ts
registry: packages/blocks/registry.json
related: [model-router-01, storage-usage-01, chart, status-overview, info-item]
---

# 项目监控

嵌入式数据 block，不创建应用外壳。沿用 model-router-01 的表面层次与 768px 宽度上限。导航直接使用 variant="pill"、color="neutral" 的胶囊 Tabs，不再包裹额外的浮层背景容器。默认导航、字段标签、无障碍提示和操作反馈为中文；项目、区域、仓库、迁移、存储桶和服务名称保留原文。

```tsx
import { ProjectMonitor, projectMonitorDemoData } from "@/components/blocks/project-monitor-01";

export function ProjectPreview() {
  return <ProjectMonitor data={projectMonitorDemoData} />;
}
```

## 数据接入

`data.project` 提供稳定项目 ID、名称、区域、地址、健康状态和资料；`metrics` 提供数值、同单位上限及单位。没有上限的带宽使用 MetricCard，不伪造比例。环形图超量时填满，但文本保留真实数值。

存储容量与分类、存储桶大小均使用十进制字节，展示时转换 GB / MB。已用容量由分类求和。未知数据用 null；零是有效数值。缺失的容量或分类不绘制误导性进度条。

`windows` 为可选统计窗口，每个窗口包含起止毫秒时间戳、服务分桶与服务端延迟分位数。窗口内所有服务必须提供相同数量、连续等长的分桶，且 success / warning / errors 为互斥请求计数。总请求、趋势、峰值、占比和成功率从同一组分桶计算。null 分桶显示未知，趋势保留断点，汇总不可用；无请求与缺失数据明确区分。P50 / P95 / P99 使用服务端值，禁止平均分位数。latencyScaleMs 为三个延迟条共用的毫秒标尺，超出时扩展标尺以保留真实数据。

`updatedAt` 和存储桶更新时间为毫秒时间戳；不会自动伪造“刚刚更新”。默认 locale 为 zh-CN，timeZone 为 Asia/Shanghai。

## 交互与状态

`tab` / `defaultTab` / `onTabChange` 和 `range` / `defaultRange` / `onRangeChange` 支持受控与非受控模式；视图之间共享窗口选择。窗口变化只选择传入的数据，由宿主加载和更新快照。无效受控窗口不回退到别的窗口，以免展示错误时间范围。切换项目重置非受控选择。

`state` 为 ready、loading、stale、error。过期保留快照并提示，首次加载显示 Skeleton，首次失败使用 Alert 并可通过 actions.onRetry 重试。默认 error 仍隐藏指标以保留旧接口行为；已有快照的刷新失败显式传 `retainDataOnError`，保留图表和指标并显示局部错误。`refreshing` 是独立可选属性，可以与 stale 同时存在。宿主提供 statusMessage 可替换默认提示。

`actions.onRefresh` 可选；onRefresh/onRetry 可以返回 Promise，组件等待完成并阻止同一数据操作的重复触发，拒绝时保留可用快照并提示。组件只触发回调，宿主负责成功后更新 data/state；不会将旧数据偷偷改成新鲜。tabs、复制、自定义等无关操作仍可用。

地址复制通过 Button / Tooltip 组合完成，成功和失败均有中文反馈。actions.onOpenDashboard / onCustomize 只在传入时显示；组件不自行导航或请求网络。演示的“打开独立预览”打开本地完整预览，自定义开关实际控制资源与活动区显隐。所有演示数据明确标注为示例。

`visibleSections` 控制资源与服务活动区。`advisor` 有内容时才显示“优化建议”标签。`labels` 覆盖公共文案，业务标签通过 data 传入。

## 组件与样式

使用 Card、Tabs、InfoItem、Badge、StatusOverview、StorageUsage、MetricCard、Chart、Select、Button、Tooltip、Skeleton、Empty、Badge plain、Alert 和 InlineNotice。服务状态通过 StatusOverview 的 variant="activity" 呈现：名称、细竖条轨道和请求数在宽容器中同排，窄容器中轨道换行。灰色完整竖条表示空闲，较短竖条表示未知；Tooltip 保留准确计数和状态。请求趋势采用 TimeSeriesChart，环图采用 DonutSummary，服务图例采用 ChartLegend；缺失分桶保留断点和未知汇总，趋势数据可通过键盘展开。分位数比较保留专用条形图，与直方图共享分位数分类色但不合并模型。业务布局使用现有间距、字体、边框、阴影和语义颜色；未新增全局样式或色值。

CPU 等比例与服务分布通过可读文本提供非图形信息；趋势图支持键盘检查，服务状态条支持方向键和中文提示。布局使用容器断点，在窄卡片中换行。图表不播放装饰性动画。
