---
schema_version: 1
name: inspection-report-list-01
kind: block
status: stable
typecheck_examples: true
summary: 巡检报告列表，采用共同的运维工作区外壳，保留页面自己的数据与操作。
registry_import: "@/components/blocks/inspection-report-list-01"
source: packages/blocks/src/application/inspection-report-list-01/inspection-report-list.tsx
types: packages/blocks/src/application/inspection-report-list-01/inspection-report-list.tsx
registry: packages/blocks/registry.json
related: [operations-workspace-shell-01, list-pagination, page-layout]
---

# 巡检报告列表

```tsx
import { InspectionReportList } from "@zeron/blocks/inspection-report-list-01";

export function Preview() {
  return <InspectionReportList workspace={{ organizations: [{ id: "east", name: "华东团队" }], defaultOrganizationId: "east" }} />;
}
```

Registry 安装后使用 registry_import 路径。独立安装会递归安装 operations-workspace-shell-01，不需要先安装另一整页。workspace 遵循公共外壳的组织、导航、搜索、账号与会话配置；共享业务层与 React UI 不导入 Next，框架链接放在应用 renderLink 适配器中。示例搜索与诊断会话占位不代表真实后端能力。

搜索、优先级及环境筛选共同作用；筛选和页大小变化归零。数据缩减时显示并保存有效页码，重新增加数据不返回失效末页。采用 ListPagination，不创建表格引擎。onViewReport 收到原报告对象，onRefresh 保持原有接口。

## 阶段五统一契约

默认空数组使用 Empty/no-data，存在搜索、优先级或环境筛选时使用 no-results。ListPagination 的零条和页码夹取契约保持。严重/正常 strong Badge 分别使用 danger/success，不以分类红/绿承担状态。
