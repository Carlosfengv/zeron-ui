---
schema_version: 1
name: grouped-data-table-02
kind: block
status: stable
summary: 多维切换的分区表格，每组独立表头、预览与新增入口，共享搜索筛选和排序。
registry_import: "@/components/blocks/grouped-data-table-02"
source: packages/blocks/src/application/grouped-data-table-02/sectioned-data-table.tsx
types: packages/blocks/src/application/grouped-data-table-02/sectioned-data-table-types.ts
registry: packages/blocks/registry.json
related: [data-table, tabs, container, badge, input-group]
---

# 多维分组表格

React data-block，基于现有 Container / Tabs / DataTable / Badge / InputGroup，嵌入现有页面，不创建应用外壳。适合大模型、算力资源等多维分类清单。每组拥有独立表头，与 grouped-data-table-01 的单表分组布局不同。

```tsx
import { SectionedDataTable } from "@/components/blocks/grouped-data-table-02";
import type { ColumnDef } from "@tanstack/react-table";

type Resource = { id: string; name: string; status: string; provider: string };
const columns: ColumnDef<Resource, unknown>[] = [
  { accessorKey: "name", header: "资源", enableHiding: false },
  { accessorKey: "status", header: "状态", enableHiding: false },
  { accessorKey: "provider", header: "云平台", enableHiding: false },
];
export function Resources({ data }: { data: Resource[] }) {
  return <SectionedDataTable data={data} columns={columns} getRowId={(item) => item.id}
    dimensions={[
      { columnId: "status", label: "运行状态", groups: [{ value: "running", label: "运行中", color: "green" }] },
      { columnId: "provider", label: "云平台" },
    ]} />;
}
```

data 是完整客户端记录集，getRowId 必须稳定唯一。dimensions 必须非空，columnId 指向实际列，访问器返回稳定字符串，不能把本地化文案作为分组值。groups 定义展示顺序和名称、说明、Badge 分类色；color 同时用于分组圆点和 section 浅色表面，使用 Badge 公开色板与主题表面变量混合，自动适配深浅主题。标题栏与 DataTable 放在同一个圆角 section 中，表格四周留出分组底色，保留 DataTable 默认的圆角、描边和 surface-floating 背景，固定列也使用默认 floating 背景。颜色跟随稳定分组值，不受筛选、排序或切换维度影响；未配置颜色和未知分组使用中性灰色。未知值仍显示在已配置组之后，空字符串显示 labels.ungrouped。没有记录的组不显示。

groupBy / defaultGroupBy / onGroupByChange 控制分组维度。默认第一个维度，无效 ID 回退到第一个。受控模式只发送意图，等待宿主传回新 groupBy。切换维度保留搜索、筛选、排序和列设置；展开与显示更多状态按 columnId + value 分别记忆。新业务域可由宿主更换 React key 重置状态。

完整匹配数据由共享 TanStack 表格分组和排序，各分组使用已有 DataTable 渲染列头与记录，共享排序、列顺序及显隐。当前分组列自动隐藏，建议维度列 enableHiding=false，名称列保持至少一个可见列。previewRowCount 默认 3，非正数归一为 1，非有限值为 3；限制发生在排序之后。manualPagination=true；不能把远程单页数据当作完整分组。此 Block 不支持多层分组、后端分页与懒加载。

renderFilters 接收共享 table，组合现有 DataTableFacetedFilter。搜索和筛选作用于所有记录；组计数、renderStats / renderSummary 的 rows 和底部匹配数不受预览或收起影响。清空筛选清除搜索及列筛选，不修改分组维度。

onAddToGroup 返回 { columnId, value }，宿主负责预填表单或创建记录；不传时隐藏按钮。核心不注入 mock，也不默认创建记录。onRowActivate / activeRowId 接入详情与活动行，内部按钮不触发行激活。actions 提供全局业务动作。state=ready/loading/error；加载沿用列对齐 Skeleton，失败支持 errorMessage 与 onRetry。空数据、无匹配数据沿用 Empty。

Block 文案通过 labels 覆盖，导出 sectionedDataTableZhLabels / sectionedDataTableEnLabels。宿主列与筛选器分别通过 DataTableColumnHeader.labels 和 DataTableFacetedFilter.labels.clearFilters 本地化。Tabs 自带键盘交互，只构造活动维度的分组内容，组按钮具备 aria-expanded/aria-controls；长标题与分组名称支持换行。窄屏工具栏换行、表格在各自区域横向滚动。全部样式来自现有组件和语义变量。

示例独立导出 sectionedDataTableDemoItems 与 SectionedDataTableDemoItem，20 项大模型与云计算资源按运行状态、类型、云平台分组。名称、配置、容量和利用率为模拟数据，新增仅操作本地清单，详情为只读 Dialog，未连接云平台。分组新增使用对应维度值预填新记录；其余字段由演示默认值生成。

演示字段定义复用 01 的 demo-data 文件，02 导出独立的数组及记录副本，避免两个演示互相修改数据。Registry 安装 02 时只附带这份数据定义，不安装 01 组件；两个核心仍各自独立。文档页面共用 CloudResourceTableDemoShared 的列、状态映射和详情组合，正式安装不依赖此文档模块。稳定值用于分组，文档搜索同时包含翻译后的资源类型、运行状态和云平台。
