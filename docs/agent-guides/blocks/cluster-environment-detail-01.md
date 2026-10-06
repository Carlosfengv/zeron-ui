---
schema_version: 1
name: cluster-environment-detail-01
kind: block
status: stable
typecheck_examples: true
summary: 集群环境详情，采用共同的运维工作区外壳，保留页面自己的数据与操作。
registry_import: "@/components/blocks/cluster-environment-detail-01"
source: packages/blocks/src/application/cluster-environment-detail-01/cluster-environment-detail.tsx
types: packages/blocks/src/application/cluster-environment-detail-01/cluster-environment-detail.tsx
registry: packages/blocks/registry.json
related: [operations-workspace-shell-01, list-pagination, page-layout]
---

# 集群环境详情

```tsx
import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";

export function Preview() {
  return <ClusterEnvironmentDetail workspace={{ organizations: [{ id: "east", name: "华东团队" }], defaultOrganizationId: "east" }} />;
}
```

Registry 安装后使用 registry_import 路径。独立安装会递归安装 operations-workspace-shell-01，不需要先安装另一整页。workspace 遵循公共外壳的组织、导航、搜索、账号与会话配置；共享业务层与 React UI 不导入 Next，框架链接放在应用 renderLink 适配器中。示例搜索与诊断会话占位不代表真实后端能力。

环境、巡检报告选择、受控 activeSection 与操作回调保留。顶栏面包屑使用当前 environment.name。详情中的 DataTable 保留内置分页，资源/网络拓扑与问题处置插槽仍由宿主提供。

## 阶段五统一契约

reports=[] 时保留环境摘要、路径、工作区和原操作回调，以 Empty 表达尚无报告；不再返回空白页。报告选择、总分与 incidentTotal 的原口径保持。优先级 strong Badge 使用 danger/warning，分数强调使用 info。资源摘要图表沿用用户指定的蓝色主题。演示设置可选择“无巡检报告”，示例巡检只恢复示例数据。
