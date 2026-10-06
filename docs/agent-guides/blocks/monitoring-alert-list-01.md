---
schema_version: 1
name: monitoring-alert-list-01
kind: block
status: stable
typecheck_examples: true
summary: 告警工作区，分别表达严重程度与处置状态，保留筛选、分页与宿主动作。
registry_import: "@/components/blocks/monitoring-alert-list-01"
source: packages/blocks/src/application/monitoring-alert-list-01/monitoring-alert-list.tsx
types: packages/blocks/src/application/monitoring-alert-list-01/monitoring-alert-list.tsx
registry: packages/blocks/registry.json
related: [badge, alert, popover, sidebar]
---

# 监控告警列表

```tsx
import { MonitoringAlertList, defaultMonitoringAlertItems } from "@zeron/blocks/monitoring-alert-list-01";

export function AlertsPreview() {
  return <MonitoringAlertList alerts={defaultMonitoringAlertItems} state="error" retainDataOnError onRefresh={async () => {}} onRetry={async () => {}} />;
}
```

示例使用工作区公共导出，Registry 安装后改从 `@/components/blocks/monitoring-alert-list-01` 导入。

severity/level 保留原始严重程度，resolutionState 表达是否已处置，两者互不替代。处置记录支持鼠标及键盘读取；点击已处置按钮不再次调用 onResolve。onResolve/onMute/onAnalyze 收到原始告警，由宿主更新 alerts，组件不自动向后端写入。

搜索、严重程度及环境筛选共同作用，筛选与每页条数变化重置页码。数据数组缩减时显示有效页，不出现有结果却空白的末页。宽表在内容区域内横向滚动，不将整个页面撑宽。分页采用 ListPagination，数据筛选和页码仍由列表管理。

state 支持 ready/loading/stale/error；refreshing 独立表达后台更新。首次加载用 Skeleton，首次失败用 Alert；retainDataOnError 保留受控失败时的列表。刷新回调拒绝时自动保留当前数据并使用局部 InlineNotice，静态错误不自动重复宣告。onRefresh/onRetry 支持 Promise 和重复触发保护，宿主成功后更新数组及状态。

复用 PageLayout、Sidebar、Badge、Badge plain、InlineNotice、Alert、Skeleton、Empty、Popover、Select 和 ButtonGroup，不新建第二套公共状态 API。文档演示的处置更新记录，静音移除指定行，AI 入口显示明确标注的示例说明；没有真实 AI 或后端接入。

阶段四：workspace 可配置共同的 OperationsWorkspaceShell，集中组织、导航、搜索、诊断和账号。独立安装递归解析共享外壳，不依赖另一整页；源实现不再导入 Next，应用通过 renderLink 绑定框架路由。

## 阶段五统一契约

告警严重性视觉映射 danger/warning/info；P0/P1 等领域等级与 resolutionState 保持独立。静音、处置和优先级不是一套状态枚举，不合并数据模型。
