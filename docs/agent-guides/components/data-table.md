---
schema_version: 1
name: data-table
kind: component
status: stable
summary: 基于 TanStack Table 的数据表，包含筛选、排序、分页、选择、固定列和跨列分组标题。
registry_import: "@/components/ui/data-table"
source: packages/ui/src/components/data-table.tsx
registry: packages/ui/registry.json
related: [table, badge, button]
---

# DataTable

useDataTable 接收 TanStack TableOptions，提供本地或受控的筛选、排序、选择、分页、列顺序、列显隐和固定状态；其他状态如 grouping / expanded 通过 state 透传。加载、空状态、行激活、横向滚动和固定列表现由 DataTable 负责。

## 分组

向 useDataTable 提供 getGroupedRowModel()、getExpandedRowModel() 和 initialState.grouping / expanded；DataTable 自动把 TanStack 的合成组渲染为横跨可见列的标题，保留原生 table 语义。普通记录仍采用 ColumnDef.cell，组行不会触发 onRowActivate。多列 grouping 支持嵌套组；统计只包含匹配叶子记录。

grouping 是可选的 DataTableGroupingOptions：getLabel 提供可访问分组名；getOrder 提供与记录排序独立的组顺序；getRowLimit 限制展示的直接子项；renderHeader 自定义展开按钮之后的内容；renderFooter 自定义展开组末尾跨列行的内容。renderFooter 返回 null 时不生成额外行。上下文包含 row、table、leafRowCount、visibleRowCount。嵌套分组的 visibleRowCount 统计直接子组，leafRowCount 统计全部匹配记录。labels.expandGroup / collapseGroup 支持本地化。

展示限制不会改写 table 的数据、筛选或统计模型；分页依然受 TanStack 行模型约束。需要完整分组且使用组内预览时，设置 manualPagination=true 和 showPagination=false。启用全局分页时可能跨页截断分组，leafRowCount 仍为完整匹配组计数。

density="comfortable" 保留现有单元格间距；density="compact" 使用库内紧凑配方，同步加载单元格，但不改变行内 Button / Input 的尺寸。不要用外部后代选择器修改表格内部几何。

## 业务组合

工具栏通过 children 放置于表格上方。DataTableColumnHeader、DataTableFacetedFilter、DataTableToolbar、DataTableViewOptions 可分别组合；避免重复工具栏和分页。activeRowId / onRowActivate 支持活动行及键盘激活，并排除行内交互控件。getRowId 使用稳定业务 ID。

DataTableColumnHeader.labels 可覆盖 ascending / descending / resetSorting / hideColumn，DataTableViewOptions.labels 提供列设置文案。DataTableFacetedFilter.labels.clearFilters 覆盖弹层内的清空操作。均为可选属性，未传时保留已有英文默认值。
