---
schema_version: 1
name: data-table
kind: component
status: stable
summary: 基于 TanStack Table 的数据表，包含筛选、排序、分页、选择、固定列和跨列分组标题。
registry_import: "@/components/ui/data-table"
source: packages/ui/src/components/data-table.tsx
registry: packages/ui/registry.json
related: [table, badge, button, grouped-data-table-01, grouped-data-table-02]
---

# DataTable

useDataTable 接收 TanStack TableOptions，提供本地或受控的筛选、排序、选择、分页、列顺序、列显隐和固定状态；其他状态如 grouping / expanded 通过 state 透传。加载、空状态、行激活、横向滚动和固定列表现由 DataTable 负责。

variant 默认 framed，保留表格自身的背景、边框和圆角。嵌入已有分组或卡片时使用 variant="embedded"，由父容器拥有表面和外框；通过 style.backgroundColor 传入与父容器相同的背景，固定列及其加载占位也使用该背景。切换外观不重建表格内容，悬停、选中和局部横向滚动保持原有行为。

## 固定表头

`stickyHeader` 将表头固定在表格内容滚动区顶部，默认将该区域最高限制为 `min(65dvh, 40rem)`；分页器和工具栏位于滚动区外。`scrollAreaMaxHeight` 可覆盖这一高度，也可独立用于限定内容区。未启用时不限制高度，保留现有页面滚动。固定表头复用当前表面背景，支持与 columnPinning 同时使用；时间等固定列在表头与表体交叉位置保持可见。表头的固定范围为表格自身内容区，不会悬浮到表格之外。

## 分组

向 useDataTable 提供 getGroupedRowModel()、getExpandedRowModel() 和 initialState.grouping / expanded；DataTable 自动把 TanStack 的合成组渲染为横跨可见列的标题，保留原生 table 语义。普通记录仍采用 ColumnDef.cell，组行不会触发 onRowActivate。多列 grouping 支持嵌套组；统计只包含匹配叶子记录。

grouping 是可选的 DataTableGroupingOptions：getLabel 提供可访问分组名；getOrder 提供与记录排序独立的组顺序；getRowLimit 限制展示的直接子项；renderHeader 自定义展开按钮之后的内容；renderFooter 自定义展开组末尾跨列行的内容。renderFooter 返回 null 时不生成额外行。上下文包含 row、table、leafRowCount、visibleRowCount。嵌套分组的 visibleRowCount 统计直接子组，leafRowCount 统计全部匹配记录。labels.expandGroup / collapseGroup 支持本地化。

展示限制不会改写 table 的数据、筛选或统计模型；分页依然受 TanStack 行模型约束。需要完整分组且使用组内预览时，设置 manualPagination=true 和 showPagination=false。启用全局分页时可能跨页截断分组，leafRowCount 仍为完整匹配组计数。

density="comfortable" 保留现有单元格间距；density="compact" 使用库内紧凑配方，同步加载单元格，但不改变行内 Button / Input 的尺寸。不要用外部后代选择器修改表格内部几何。

## 记录标题与跨列明细

`renderRowHeader({ row, previousRow, table })` 在普通记录之前渲染跨列内容，可按日期等业务字段插入只读分组标题。previousRow 是当前页的前一普通记录；页首或 TanStack 分组边界为 undefined，因此跨页日期会重复展示标题。返回 null / boolean 不生成标题行。

`renderExpandedRow({ row, table })` 仅在 row.getIsExpanded() 为 true 时调用；通过 getRowCanExpand 与 TanStack expanded 状态控制普通记录展开，返回 null / boolean 不生成明细行。展开内容跨全部可见列，列显隐后同步跨度；不会额外占用分页名额。可组合 onRowActivate 与行内展开按钮，内部控件不会重复激活整行。此插槽不需要把明细伪装成数据记录，也不需要 getSubRows；已有树形与 TanStack 分组契约保持不变。

这两个插槽中的业务内容由宿主提供，TableRow / TableCell、背景、跨列与分页结构由 DataTable 拥有。需要可折叠分组时继续使用 grouping；只读日期分隔与 Session 展开可参考 agent-runs-01。

## 业务组合

分页器的每页数量、页码和翻页按钮在窄屏保持同行。选择框和按钮保留标准尺寸，空间不足时说明文字与页码单行省略，完整文案仍保留在 DOM / 无障碍内容中；每页说明也有 title。带选择列的选中数量反馈可独立排列，不挤压分页操作。

工具栏通过 children 放置于表格上方。DataTableColumnHeader、DataTableFacetedFilter、DataTableToolbar、DataTableViewOptions 可分别组合；避免重复工具栏和分页。activeRowId / onRowActivate 支持活动行及键盘激活，并排除行内交互控件。getRowId 使用稳定业务 ID。

DataTableColumnHeader.labels 可覆盖 ascending / descending / resetSorting / hideColumn，DataTableViewOptions.labels 提供列设置文案。DataTableFacetedFilter.labels.clearFilters 覆盖弹层内的清空操作。均为可选属性，未传时保留已有英文默认值。
