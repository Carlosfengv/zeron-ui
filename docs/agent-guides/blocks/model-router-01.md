---
schema_version: 1
name: model-router-01
kind: block
status: stable
summary: 展示模型路由流量、线上指标、策略草稿与故障回退设置。
registry_import: "@/components/blocks/model-router-01"
source: packages/blocks/src/application/model-router-01/model-router.tsx
types: packages/blocks/src/application/model-router-01/model-router-types.ts
registry: packages/blocks/registry.json
related:
  - credit-usage-01
  - card
  - tabs
  - select
  - switch
  - table
---

# Model Router 01

嵌入式模型路由策略卡片，不创建页面外壳。沿用 Credit Usage 的表面层次，增加固定拓扑流量动画。

```tsx
import { ModelRouter, modelRouterDemoData } from "@/components/blocks/model-router-01";

export function RoutingPreview() {
  return <ModelRouter data={modelRouterDemoData} />;
}
```

## Data contract

`data.policy` 和 `revision` 是宿主确认的线上配置；`value` / `defaultValue` 是草稿，`onValueChange` 通知编辑。未编辑时自动跟随线上策略更新；编辑后保留草稿，直到丢弃或宿主返回与草稿一致的已生效配置。切换环境重置非受控草稿；受控宿主需按环境同步 value。相同环境刷新指标保留草稿。

`routes` 使用稳定、唯一 ID。`share` 和 `errorRate` 为 0..1，延迟以秒计，单价为每千 Token 金额，`currency` 默认 USD。null、负数、非有限指标显示为不可用。汇总 P95 和混合单价由服务端按正确口径计算，不从路由分位数或请求占比推算。

## Interaction ownership

`actions.onDeploy(policy, environmentId)` 由宿主持久化；组件等待 Promise、阻止重复提交并捕获失败。成功后宿主更新 `data.policy` 和 `revision`，组件不会自行伪造线上状态。外部等待和错误通过 `operationState` 提供。编辑不能修改线上统计，回退不能选择同一模型或已移除模型。

环境由宿主通过 `data.environment` 指定，顶部不提供环境选择器。策略切换使用 `variant="segment"`、`color="neutral"` 的分段中性色 Tabs。设置、关闭与部署操作只在提供回调时显示。所有文字可通过 `labels` 覆盖，数字通过 `locale` 格式化。

## Animation and layout

SVG 粒子表达相对请求密度，不是每个真实请求。零请求线路静止。关闭 animated、用户暂停、离屏、页面隐藏、系统减少动画时不渲染粒子动画；静态拓扑仍保留。缺少动画所需的浏览器接口时退化为静态图表。图形是辅助展示，路由名称与指标在语义表格中可读。

宽度上限 768px。窄容器保留可读标签、允许头部和回退控件换行，表格仅在自身区域横向滚动。金额沿用 MetricCard 的 text-heading / font-semibold，单位使用 text-body / font-medium / text-fg-muted；SVG 位置和粒子尺寸属于专用拓扑几何，不是控件样式覆盖。

## Model identity and linked emphasis

路由可选 `colorIndex` 为 1–5，优先于原必填兼容字段 `color: BadgeColor`。共享取色工具将旧色名适配到全局槽位；SVG 主线、光点、圆点与 share 条共用解析颜色。索引不随排序或策略改变，Logo 和状态色保持独立。

`route.brand` 选择 claude、openai 或 qwen 的 Lobe 图标，独立于托管 provider；私有品牌可传入 `route.logo`。未指定 brand 时支持 Anthropic/OpenAI provider 回退，其他模型使用通用图标。图表标签、管道和表格行通过稳定的 route.id 双向联动：悬停或键盘聚焦时，图表中当前模型保持 100% 不透明度，其他模型为 40%，离开后恢复。图表标签不添加背景；表格各行始终保持完全不透明，仅对应行显示背景高亮。
