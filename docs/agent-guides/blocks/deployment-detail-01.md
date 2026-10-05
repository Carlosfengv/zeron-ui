---
schema_version: 1
name: deployment-detail-01
kind: block
status: stable
summary: 部署详情卡片，展示预览、域名、代码来源与阶段检查结果。
registry_import: "@/components/blocks/deployment-detail-01"
source: packages/blocks/src/application/deployment-detail-01/deployment-detail.tsx
types: packages/blocks/src/application/deployment-detail-01/deployment-detail-types.ts
registry: packages/blocks/registry.json
related: [project-monitor-01, model-router-01, status-overview, info-item]
---

# 部署详情

嵌入式 React 数据 block，不创建应用外壳。沿用 project-monitor-01 和 model-router-01 的 768px 上限、抬升外框与浮动内容表面。连续内容面板依次呈现标题、网站预览、部署属性、域名、来源和阶段列表。

```tsx
import { DeploymentDetail, deploymentDetailDemoData } from "@/components/blocks/deployment-detail-01";

export function DeploymentPreview() {
  return <DeploymentDetail data={deploymentDetailDemoData} />;
}
```

## 数据与状态

`data.id` 是部署稳定 ID，切换部署重置操作反馈与图片失败状态。创建/完成时间使用 epoch 毫秒；耗时使用毫秒，null 表示未知，零是有效值。传入 `now` 时显示相对日期，否则使用 locale/timeZone 格式化绝对日期；默认 zh-CN / Asia/Shanghai。网站图片通过 preview.src/alt 接入，缺失或加载失败显示空状态。

部署 lifecycle 状态与各阶段检查状态独立，ready 可以包含失败检查。阶段 segments 表示实际检查项；提供 timeline 时对应连续等长时间分桶。缺失竖条显示未知，不按耗时制造进度。摘要 metrics 使用业务计数。issues 缺失表示尚未加载，空数组表示无问题；阶段及底部数量从同一组 issues 统计。

`state` 为 ready、loading、stale 或 error。过期保留快照，加载显示 Skeleton，失败隐藏详情并支持 actions.onRetry。可通过 statusMessage 与 labels 覆盖文案。

## 交互归属

分享默认复制 shareUrl 或 url；传入 actions.onShare 时由宿主处理分享。域名与源码链接只接受 HTTP(S) 或根相对路径。组件不自动请求网络。onOpenStage（非构建阶段）和 onRetry 支持 Promise，防止重复操作并捕获失败。操作能力缺失时隐藏对应阶段详情按钮。部署切换后的异步结果不修改新部署反馈。

更多自定义域名使用 Popover；提交哈希复制使用 Dropdown/MenuItem。访问、构建日志、运行摘要和排查问题仅保留按钮展示，无点击行为。演示中的域名详情展示示例域名列表。

## 组件与响应式

使用 Card、InfoItem、Avatar、Badge、StatusOverview、Button、Dropdown、MenuItem、Popover、Tooltip、Skeleton、Empty、InlineNotice 与统一图标。StatusOverview 的 activity trailing 插槽承接阶段操作、耗时和结果；摘要是无竖条的业务行。宽容器中预览与属性并排、阶段同排；窄容器中换行。竖条保留原组件的 Tooltip、方向键和触摸交互。业务布局使用现有语义 tokens，无新增全局 CSS 或硬编码产品色。
