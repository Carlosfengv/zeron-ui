---
schema_version: 1
name: operations-workspace-shell-01
kind: component
status: stable
typecheck_examples: true
summary: ZAIops 六页共用的工作区组合，集中组织、主导航、服务导航、诊断入口、账号与搜索快捷键。
registry_import: "@/components/blocks/operations-workspace-shell-01"
source: packages/blocks/src/application/operations-workspace-shell-01/operations-workspace-shell.tsx
types: packages/blocks/src/application/operations-workspace-shell-01/operations-workspace-shell.tsx
registry: packages/blocks/registry.json
related: [sidebar, page-layout, user-account-01]
---

# OperationsWorkspaceShell

```tsx
import { OperationsWorkspaceShell } from "@zeron/blocks/operations-workspace-shell-01";
import { PageBody, PageContent } from "@zeron/ui/page-layout";

export function OperationsPreview() {
  return <OperationsWorkspaceShell title="集群环境" activeNavigation="clusters" workspace={{ organizations: [{ id: "east", name: "华东团队" }], defaultOrganizationId: "east", navigation: [{ value: "clusters", label: "集群环境", iconName: "list", href: "/clusters" }] }}><PageContent><PageBody>应用内容</PageBody></PageContent></OperationsWorkspaceShell>;
}
```

Registry 安装后改用 registry_import 指定的路径。children 直接提供 PageContent，不再嵌套另一层 PageLayout 或 SidebarProvider。PageBody 保持内容滚动职责。

workspace 提供 organizations / organizationId / defaultOrganizationId / onOrganizationChange。ID 与名称分开；受控模式仅发出回调，宿主更新后才改变选择。空组织列表显示暂无组织，不伪造选择。activeNavigation 是导航配置中的 value：默认 home、clusters、reports、alerts，服务导航默认 service-progress、service-authorizations、operation-history。

navigation / serviceNavigation 支持 href、onSelect 和 disabled。onNavigationSelect 存在时由宿主负责导航，不同时执行原生链接跳转。renderLink 可接入应用的路由组件；共享实现没有 Next 导入。默认主导航是演示地址，生产应用必须提供实际路径。诊断会话通过 sessions 和 onSessionSelect / onCreateSession / onSessionRename / onSessionDelete 接入；未提供的动作不显示为已实现能力。

searchOpen / onSearchOpenChange 可受控，searchContent 由应用提供。默认搜索内容只是入口占位，未连接检索服务。Meta / Ctrl + K 忽略编辑区、输入法组合和重复键；焦点所在的工作区处理事件，其他工作区不会重复打开。监听随外壳卸载清理。

account 使用现有 UserAccountProps，主题、语言、设置、通知、退出的动作由应用提供；null 隐藏账号。默认静态身份只有展示能力。折叠与移动浮层复用同一导航面板，选中入口时关闭浮层，关闭后按 Sidebar / Dialog 的既有规则返回焦点。
