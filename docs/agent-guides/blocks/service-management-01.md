---
schema_version: 1
name: service-management-01
kind: block
status: stable
typecheck_examples: true
summary: 服务管理，采用共同的运维工作区外壳，保留页面自己的数据与操作。
registry_import: "@/components/blocks/service-management-01"
source: packages/blocks/src/application/service-management-01/service-management.tsx
types: packages/blocks/src/application/service-management-01/service-management.tsx
registry: packages/blocks/registry.json
related: [operations-workspace-shell-01, list-pagination, page-layout]
---

# 服务管理

```tsx
import { ServiceManagement } from "@zeron/blocks/service-management-01";

export function Preview() {
  return <ServiceManagement workspace={{ organizations: [{ id: "east", name: "华东团队" }], defaultOrganizationId: "east" }} />;
}
```

Registry 安装后使用 registry_import 路径。独立安装会递归安装 operations-workspace-shell-01，不需要先安装另一整页。workspace 遵循公共外壳的组织、导航、搜索、账号与会话配置；共享业务层与 React UI 不导入 Next，框架链接放在应用 renderLink 适配器中。示例搜索与诊断会话占位不代表真实后端能力。

defaultView / view / onViewChange 保留受控与非受控行为；三个服务导航 value 分别切换服务进度、服务授权和操作记录。受控视图只发出一次 onViewChange。工单、授权、操作记录表继续使用 DataTable 与其内置分页，不新增第二个分页入口。

## 阶段五统一契约

服务进度中的处置优先级 strong Badge 使用语义 danger/warning。服务进度、服务授权、操作记录的受控 view、列设置和各自业务数据继续独立。
