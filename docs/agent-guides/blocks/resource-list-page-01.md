---
schema_version: 1
name: resource-list-page-01
kind: block
status: stable
summary: 使用 Sidebar Basic 标准壳层的 MCP 应用与分类管理页面。
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

优先使用此 Block 搭建 MCP 管理工作区。它复用 Sidebar Basic 应用壳层，并按 Zentirx MCP 管理设计通过现有 `Tabs` 与 `ResourceListTable` 组合 MCP 列表和分类管理。

## Use when

- 需要从零开始交付完整资源列表页面，而不是向已有页面嵌入一张表格。
- 页面需要 Sidebar Basic 的图标折叠导航、分组菜单、页头、面包屑和 MCP 管理 Tabs。
- MCP 与分类数据符合 `ResourceListItem`，搜索、分类/状态筛选和分页由现有 `ResourceListTable` 覆盖。

## Do not use when

- 项目已经有应用级 Sidebar：保留现有宿主，在现有 `PageBody` 中直接使用 `ResourceListTable`，或用 `PageLayout` 与 `DataTable` 重新组合。
- 只需要嵌入式表格：使用 `resource-list-table-01`。
- 导航模型、列表交互或响应式结构与此 Block 明显不同：从布局和基础组件重新组合。

## Integration

```tsx
import { ResourceListPage } from "@zeron/blocks/resource-list-page-01";

<ResourceListPage
  dataMode="controlled"
  resources={mcpResources}
  categoryResources={categories}
  workspaceId={workspaceId}
  workspaces={workspaces}
  onCreate={openCreate}
  onEdit={openResource}
  onRefresh={refreshResources}
  onWorkspaceChange={setWorkspaceId}
  onNavigationSelect={navigate}
/>
```

真实业务接入必须使用 `dataMode="controlled"`，此时缺失数据会显示加载或空状态，不会回退到内置 mock。文档预览和原型才使用默认的 `dataMode="demo"`。MCP 使用稳定的 `categoryId` 关联分类；`category` 仅作为列表中的本地化展示名称，不应承担外键职责。

替换 `navigation`、`workspaces`、`breadcrumb`、`accountName` 和 `accountEmail` 以匹配产品。Workspace 推荐使用 `{ id, name }`，通过 `workspaceId` 和 `onWorkspaceChange` 受控；稳定 ID 也用于在 Workspace 切换时隔离表格的选择状态。字符串 Workspace 与 `workspaceName` 仅用于兼容旧用法。

导航项可提供真实的 `href` 和显式 `group`，不要依赖数组位置表达 Workspace / Manage 分组。账户头像可通过 `accountAvatar` 替换；使用 `onAccountAction` 接入默认账户操作，或通过 `accountSections` 替换完整菜单。`activeNavigation` 应由真实路由状态提供。`activeSection`、`onSectionChange` 可受控同步当前 Tab，`sectionContent` 可替换 MCP 列表或分类管理内容。

Block 默认展示 `defaultMcpResourceListItems` 与 `defaultMcpCategoryItems`，用于本页原型。每条 MCP 的 `categoryId` 关联分类，分类数量与右侧详情在 `categoryDataMode="client"` 下从完整 MCP 数据实时计算；默认 mock 覆盖办公协同、代码开发、创意设计和销售，并使用项目已有的 `@thesvg/icons` 产品标识。

服务端分页时使用 `categoryDataMode="remote"`：分类的 `itemCount` 保留后端权威总数，当前分类详情通过 `categoryApplications[categoryId]` 提供。`onCategoryOpen` 会在初始分类和后续选择变化时触发，可用于请求详情；`categoryDetailsState` 提供分类关联请求的 loading、error 和自定义 empty 状态，`onRetryCategoryApplications` 连接重试。`selectedCategoryId` 可将主从选择设为受控状态，`categoryTableProps` 为分类列表提供独立的服务端查询和分页。

`onRemoveCategoryApplication` 可返回 Promise。操作期间按钮显示 loading 并防止重复提交，失败时保留原数据并展示错误；组件不再伪造成功删除。通过 `canCreateMcp`、`canCreateCategory` 和 `canRemoveCategoryApplication` 接入权限，通过 `labels` 与 `categoryLabels` 接入本地化文案。

后端分页与筛选使用受控查询模式：

```tsx
<ResourceListPage
  dataMode="controlled"
  resources={query.data?.items ?? []}
  tableProps={{
    isLoading: query.isLoading,
    queryState,
    totalRowCount: query.data?.total ?? 0,
    onQueryStateChange: setQueryState,
  }}
/>
```

省略 `queryState` 时，表格按完整客户端数据集执行本地搜索、筛选、排序和分页。传入 `queryState` 后，`queryState` 的 `search`、`categoryIds`、`statuses`、`sorting`、`pageIndex` 与 `pageSize` 全部改由业务数据层处理；筛选或排序变化会把 `pageIndex` 重置为 `0`。

Block 保留 Sidebar Basic demo 顶部的 Workspace 切换 dropdown、Workspace / Manage 分组、底部个人账户 dropdown、`collapsible="icon"` 行为与页头面包屑。内容顶部使用 `PageContentHeader > Tabs`；MCP 列表复用 `ResourceListTable surface="plain"`。分类管理沿用 `member-department-01` 部门页的 `PageColumns > PagePrimary + PageAside` 主从布局，左侧分类表提供搜索、添加分类与分页，右侧详情栏提供分类内应用搜索与移除；低于 `xl` 时详情使用 `MobileDrawer side="end"`。

右侧 `PageLayout` 与 `PageBody` 保持全宽，较窄视口仍占满 Sidebar 之外的可用宽度。布局、颜色、间距、圆角和交互状态全部来自现有 Zeron 组件与语义 token，没有引入独立组件或硬编码视觉值。

## Verification checklist

- [ ] 桌面端显示左侧导航，折叠后可恢复。
- [ ] Sidebar 顶部显示当前 Workspace，dropdown 可切换候选 Workspace。
- [ ] Sidebar 底部显示个人头像、姓名和邮箱，账户 dropdown 可打开。
- [ ] 窄屏下 Sidebar 按 Basic demo 的图标折叠模式工作。
- [ ] 默认显示 MCP 列表，包含名称、分类、状态与可见范围。
- [ ] MCP 列表与分类管理 Tabs 可切换并保持正确激活状态。
- [ ] 分类管理显示分类名称与后端权威 MCP 数量。
- [ ] 服务端模式下分类筛选、排序和分页均通过受控查询状态请求完整数据集。
- [ ] Workspace 切换后分类选择、详情请求和 mutation 状态不会串到其他 Workspace。
- [ ] 分类详情覆盖 loading、error、retry、empty 和无权限状态。
- [ ] 页面只有一个创建入口。
- [ ] 搜索、筛选、行选择、批量操作、刷新和分页均连接真实行为。
- [ ] 长表格只在内容区滚动，没有页面级横向溢出。
