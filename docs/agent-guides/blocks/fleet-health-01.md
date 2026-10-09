---
schema_version: 1
name: fleet-health-01
kind: block
status: stable
locale: zh-CN
summary: 实时推理吞吐、集群指标和支持三种遥测视图的 GPU 健康面板。
package_import: "@zeron/blocks/fleet-health-01"
registry_import: "@/components/blocks/fleet-health-01"
source: packages/blocks/src/application/fleet-health-01/fleet-health.tsx
registry: packages/blocks/registry.json
typecheck_examples: true
related: [container, live-line-chart, select, tabs, badge, button, tooltip, inline-notice, icon-context, utils]
---

# Fleet Health 01

安装 `npx zeron-ui add fleet-health-01`，嵌入已有页面，不附加应用外壳。Registry 项目使用 `@/components/blocks/fleet-health-01` 导入。

```tsx
import { FleetHealth, createFleetHealthDemoData, fleetHealthDemoClusters } from "@zeron/blocks/fleet-health-01";

export function FleetPreview() {
  return <FleetHealth data={createFleetHealthDemoData()} clusterId="kestrel-iad-3" clusters={fleetHealthDemoClusters} />;
}
```

`data` 为 `FleetHealthSnapshot`：吞吐、同比变化、TTFT、模型数、利用率、队列深度/容量、功耗/容量、Unix 秒时间样本与节点列表。节点与 GPU 使用稳定 id；GPU id 只需在节点内唯一。测量缺失传 null，零有效。单卡利用率和显存占比必须在 0–100；无效读数不补零。离线设备不参与行均值，在线设备读数缺失则均值未知。温度阈值默认为 84°C，独立于当前视图。

`metric`/`onMetricChange` 与 `selectedNodeId`/`onNodeSelect` 支持受控使用；不传状态时使用本地状态。`clusters`、`clusterId`、`onClusterChange` 接入真实集群选择。`live` 控制趋势滚动和状态标签，不启动数据源；宿主负责连接和提供当前时间样本。`refreshIntervalMs` 为显示用采样间隔。`onRebalance`、`rebalancing`、`onSettings` 接入宿主操作；未传操作不显示入口。`footerActions` 和 `notice` 为宿主插槽，操作异常通过 notice 呈现。使用 `labels`/`locale` 本地化，可传 `fleetHealthZhLabels`。

使用 Container 的 raised 外框和 floating 内容，控件尺寸与状态由原组件拥有。热力单元使用 brand/surface-floating 动态混色；danger 点表示温度越界；条纹表示排空，横线表示未知。GPU 表格为业务组合：日期型 HeatmapChart 的分箱和日期/贡献提示不适合设备状态和五项遥测。GPU 标签与 Tooltip 保留所有原始遥测，键盘方向键跨行移动、Home/End 定位、Escape 取消聚焦。

本地示例数据和文档中的模拟均衡仅用于演示，不是生产调度或实时服务接入。窄屏仅 GPU 表格横向滚动，外层高度由宿主决定。
