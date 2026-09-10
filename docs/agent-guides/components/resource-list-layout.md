---
schema_version: 1
name: resource-list-layout
kind: component
status: stable
summary: 用于资源列表、资源管理、inventory 和 resource list 的完整页面预设。
package_import: "@zeron/ui/resource-list-layout"
registry_import: "@/components/ui/resource-list-layout"
source: packages/ui/src/components/resource-list-layout.tsx
registry: packages/ui/registry.json
related:
  - page-layout
  - data-table
  - table
  - resource-list-page-01
  - resource-list-table-01
---

# ResourceListLayout

## Agent intent

使用 `ResourceListLayout` 组织完整的集合浏览页面。它统一拥有页面标题、内容表面、可选工具栏、滚动正文和可选分页区；搜索状态、筛选状态、数据请求、权限与分页数据仍由业务层负责。

当任务要求从零交付包含应用级 Sidebar 的完整资源工作区时，优先使用 `resource-list-page-01` Block。`ResourceListLayout` 本身只负责宿主内部的页面内容区，不创建应用导航。

## Use when

- 项目、资源、成员、订单等多个对象的浏览和管理。
- 主体可以是表格、卡片列表或业务状态内容。
- 页面位于已有 `AppShell` 或有明确高度的宿主中。
- 工具栏或分页需要保持在正文滚动区域之外。

## Do not use when

- 只是在已有页面中嵌入一张资源信息卡片或局部列表。
- 已匹配的完整页面 Block 已经拥有标题、表面、工具栏、分页和滚动区。
- 查看单个资源、创建资源、多步向导或主从分栏页面。
- 宿主没有明确高度，同时又要求固定工具栏或分页；此时用基础 `PageLayout` 组合文档流。

## Slot ownership

| 属性 | 区域 | 责任 |
| --- | --- | --- |
| `title`、`description` | PageHeader | 布局生成唯一 h1 与说明 |
| `actions` | PageHeader | 页面级操作，通常包含创建 |
| `toolbar` | PageContentHeader | 搜索、筛选和列表级操作 |
| `summary` | PageBody | 随列表滚动的统计或上下文 |
| `children` | PageBody | 表格、卡片、状态或业务组合 |
| `pagination` | PageContent 的末端 | 调用方提供的固定分页控件 |

可选插槽省略时不会生成空容器。默认 `size="full"`、`gutter="default"`，`PageLayout` 保持全宽，内部 `PageBody` 使用 `max-w-[1620px]`、`p-3` 与 `gap-3`。布局依赖宿主提供有界高度和可收缩的 flex 链。

## Minimal composition

```tsx
import { ResourceListLayout } from "@zeron/ui/resource-list-layout";

<ResourceListLayout title="资源">
  <ResourceTable resources={resources} />
</ResourceListLayout>
```

## Standard composition

```tsx
import { Button } from "@zeron/ui/button";
import { ResourceListLayout } from "@zeron/ui/resource-list-layout";

<ResourceListLayout
  title="资源"
  description="查看和管理已接入的资源。"
  actions={<Button onClick={openCreate}>创建资源</Button>}
  toolbar={<ResourceFilters value={filters} onChange={setFilters} />}
  summary={<ResourceSummary total={total} />}
  pagination={
    <ResourcePagination page={page} total={total} onPageChange={setPage} />
  }
>
  <ResourceTable resources={resources} />
</ResourceListLayout>
```

## ResourceListTable compatibility

`ResourceListTable` 自带搜索、筛选和分页。组合时不要同时传布局的 `toolbar` 或 `pagination`，并让页面标题区拥有唯一创建入口。

```tsx
<ResourceListLayout
  title="资源"
  actions={<Button onClick={openCreate}>创建资源</Button>}
>
  <ResourceListTable
    resources={resources}
    surface="plain"
    showCreateAction={false}
    onRefresh={refreshResources}
    onEdit={openResource}
  />
</ResourceListLayout>
```

## Incorrect composition

不要同时让布局和主体拥有相同区域：

```tsx
<ResourceListLayout title="资源" toolbar={<Filters />} pagination={<Pagination />}>
  <ResourceListTable />
</ResourceListLayout>
```

修正方式是二选一：使用 `ResourceListTable` 的完整内部行为并省略两个布局插槽，或用 `Table` / 可控 `DataTable` 组合，把工具栏和分页明确交给布局。

不要在 `ResourceListLayout` 外再创建第二个 `PageLayout`、`main` 或滚动正文；也不要把页面级创建操作放进导航地标。

## Verification checklist

- [ ] 页面位于有明确高度的宿主中。
- [ ] 只有一个 h1、一个创建入口、一个工具栏所有者和一个分页所有者。
- [ ] 长列表只让 PageBody 纵向滚动；表格横向溢出在列表组件局部处理。
- [ ] 无资源、筛选无结果、加载和失败状态由业务内容明确区分。
- [ ] 375px、768px、1440px 下标题、操作和工具栏可换行且无页面级横向溢出。
- [ ] 安装版本真实导出 `@zeron/ui/resource-list-layout`。

## API anchors

优先关注：`title`、`description`、`actions`、`toolbar`、`summary`、`children`、`pagination`、`size`、`gutter`。根 `className`、`style` 与 DOM 属性只透传到根 `PageLayout`。
