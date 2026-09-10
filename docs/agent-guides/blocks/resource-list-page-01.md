---
schema_version: 1
name: resource-list-page-01
kind: block
status: stable
summary: 使用 Sidebar Basic 标准壳层的完整基础资源列表页面。
package_import: "@zeron/blocks/resource-list-page-01"
registry_import: "@/components/blocks/resource-list-page-01"
source: packages/blocks/src/application/resource-list-page-01/resource-list-page.tsx
registry: packages/blocks/registry.json
related:
  - page-layout
  - resource-list-table-01
  - sidebar
  - sidebar-account-menu
---

# Resource List Page 01

## Agent intent

优先使用此 Block 搭建新的通用资源管理页。它完整复用 Sidebar 组件 Basic demo 的应用壳层，只把 Overview 中原来的 `Project overview` 内容替换为带搜索、状态筛选、选择和分页的 `ResourceListTable`。

## Use when

- 需要从零开始交付完整资源列表页面，而不是向已有页面嵌入一张表格。
- 页面需要 Sidebar Basic 的图标折叠导航、分组菜单、页头、面包屑和页面内子导航。
- 数据符合 `ResourceListItem`，并且搜索、筛选、选择与分页由现有 `ResourceListTable` 覆盖。

## Do not use when

- 项目已经有应用级 Sidebar：保留现有宿主，只使用 `ResourceListLayout` 或 `ResourceListTable`。
- 只需要嵌入式表格：使用 `resource-list-table-01`。
- 导航模型、列表交互或响应式结构与此 Block 明显不同：从布局和基础组件重新组合。

## Integration

```tsx
import { ResourceListPage } from "@zeron/blocks/resource-list-page-01";

<ResourceListPage
  resources={resources}
  workspaceId={workspaceId}
  workspaces={workspaces}
  onCreate={openCreate}
  onEdit={openResource}
  onRefresh={refreshResources}
  onWorkspaceChange={setWorkspaceId}
  onNavigationSelect={navigate}
/>
```

替换 `navigation`、`workspaces`、`breadcrumb`、`accountName` 和 `accountEmail` 以匹配产品。Workspace 推荐使用 `{ id, name }`，通过 `workspaceId` 和 `onWorkspaceChange` 受控；稳定 ID 也用于在 Workspace 切换时隔离表格的选择状态。字符串 Workspace 与 `workspaceName` 仅用于兼容旧用法。

导航项可提供真实的 `href` 和显式 `group`，不要依赖数组位置表达 Workspace / Manage 分组。账户头像可通过 `accountAvatar` 替换；使用 `onAccountAction` 接入默认账户操作，或通过 `accountSections` 替换完整菜单。`activeNavigation` 应由真实路由状态提供。`sectionHrefs` 可接入页内路由，`sectionContent` 可替换 Overview、Members 或 Activity 的内容。

`ResourceListTable` 默认使用空数组，不会在 `resources` 未到达时展示示例资源。通过 `tableProps` 传递 `isLoading`、`loadingMessage`、`emptyState`、`labels`、权限相关操作开关和工具栏扩展。`defaultResourceListItems` 只应在文档或产品原型中显式传入。

后端分页与筛选使用受控查询模式：

```tsx
<ResourceListPage
  resources={query.data?.items ?? []}
  tableProps={{
    isLoading: query.isLoading,
    queryState,
    totalRowCount: query.data?.total ?? 0,
    onQueryStateChange: setQueryState,
  }}
/>
```

省略 `queryState` 时，表格按完整客户端数据集执行本地搜索、筛选和分页。传入 `queryState` 后，搜索、状态筛选与分页改由业务数据层处理；查询条件变化会通过 `onQueryStateChange` 返回，筛选变化会把 `pageIndex` 重置为 `0`。

Block 保留 Sidebar Basic demo 顶部的 Workspace 切换 dropdown、Workspace / Manage 分组、底部个人账户 dropdown、`collapsible="icon"` 行为、页头面包屑与 `PageSubnav`。Overview 内的 `ResourceListTable` 使用 `surface="plain"`，表格自身拥有创建、搜索、筛选、选择、刷新和分页操作。

右侧 `PageLayout` 保持全宽，其内部 `PageBody` 默认居中并限制为 `max-w-[1620px]`；较窄视口仍占满 Sidebar 之外的可用宽度。

## Verification checklist

- [ ] 桌面端显示左侧导航，折叠后可恢复。
- [ ] Sidebar 顶部显示当前 Workspace，dropdown 可切换候选 Workspace。
- [ ] Sidebar 底部显示个人头像、姓名和邮箱，账户 dropdown 可打开。
- [ ] 窄屏下 Sidebar 按 Basic demo 的图标折叠模式工作。
- [ ] Overview 显示 Data Table，不再显示 `Project overview` 标题占位。
- [ ] Members 与 Activity 子导航仍可切换到对应内容。
- [ ] 页面只有一个创建入口。
- [ ] 搜索、筛选、行选择、批量操作、刷新和分页均连接真实行为。
- [ ] 长表格只在内容区滚动，没有页面级横向溢出。
