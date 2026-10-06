---
schema_version: 1
name: zaiops-operations-01
kind: block
status: stable
typecheck_examples: true
summary: 运维首页，采用共同的运维工作区外壳，保留页面自己的数据与操作。
registry_import: "@/components/blocks/zaiops-operations-01"
source: packages/blocks/src/application/zaiops-operations-01/zaiops-operations.tsx
types: packages/blocks/src/application/zaiops-operations-01/zaiops-operations.tsx
registry: packages/blocks/registry.json
related: [operations-workspace-shell-01, list-pagination, page-layout]
---

# 运维首页

```tsx
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";

export function Preview() {
  return <ZaiopsOperations workspace={{ organizations: [{ id: "east", name: "华东团队" }], defaultOrganizationId: "east" }} />;
}
```

Registry 安装后使用 registry_import 路径。独立安装会递归安装 operations-workspace-shell-01，不需要先安装另一整页。workspace 遵循公共外壳的组织、导航、搜索、账号与会话配置；共享业务层与 React UI 不导入 Next，框架链接放在应用 renderLink 适配器中。示例搜索与诊断会话占位不代表真实后端能力。

原 title、description、children 与 account 接口保留；显式 account（包括 null）优先于 workspace.account。
