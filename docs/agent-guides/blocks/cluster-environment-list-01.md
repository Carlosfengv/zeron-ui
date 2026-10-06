---
schema_version: 1
name: cluster-environment-list-01
kind: block
status: stable
typecheck_examples: true
summary: 集群环境工作区，分别表达资源健康和数据新鲜度，支持筛选及宿主刷新。
registry_import: "@/components/blocks/cluster-environment-list-01"
source: packages/blocks/src/application/cluster-environment-list-01/cluster-environment-list.tsx
types: packages/blocks/src/application/cluster-environment-list-01/cluster-environment-list.tsx
registry: packages/blocks/registry.json
related: [badge, alert, sidebar, tabs]
---

# 集群环境列表

```tsx
import { ClusterEnvironmentList, defaultClusterEnvironments } from "@zeron/blocks/cluster-environment-list-01";

export function EnvironmentPreview() {
  return <ClusterEnvironmentList environments={defaultClusterEnvironments} state="stale" onRefresh={async () => {}} onRetry={async () => {}} />;
}
```

示例使用工作区公共导出，Registry 安装后改从 `@/components/blocks/cluster-environment-list-01` 导入。

健康由 health 指定，新鲜度由 freshness 指定。正常健康与过期数据可以同时存在；过期筛选不改变健康分类。搜索匹配环境名称及位置，零条数据与筛选无结果使用不同空态，后者可以清空筛选。

state 支持 ready/loading/stale/error；refreshing 独立于 state。首次加载显示 Skeleton，首次失败显示 Alert。已有快照的受控失败需显式 retainDataOnError，展示 InlineNotice 并保留结果。新发生的回调拒绝只宣告一次，不同时重复展示过期错误。statusMessage 覆盖宿主提示。

onRefresh/onRetry 可以返回 Promise，等待完成期间阻止重复数据操作；成功后由宿主更新 environments/state，新数组不会受到旧数组请求失败的覆盖。onViewDetails 接收原始环境对象。组织选择为本地导航演示，不自行加载其他组织的数据；宿主环境、权限和后端集成需要另行提供。

复用 Sidebar、PageLayout、CardGroup、Tabs、Badge plain、InlineNotice、Alert、Skeleton 和 Empty；不新增页面专用状态原语或图表依赖。公共状态名称与其他试点一致，领域健康枚举保留。文档演示支持状态切换、真实异步失败/重试和环境详情弹层，全部使用示例数据。

阶段四：workspace 可配置共同的 OperationsWorkspaceShell，集中组织、导航、搜索、诊断和账号。独立安装递归解析共享外壳，不依赖另一整页；源实现不再导入 Next，应用通过 renderLink 绑定框架路由。

## 阶段五统一契约

critical/warning/offline 的 strong Badge 使用语义 danger/warning/neutral 及专属前景填充配对；normal 保留 success 轻量标签。数据过期始终独立于健康结论。不再通过分类红/琥珀/灰来生成强强调状态。
