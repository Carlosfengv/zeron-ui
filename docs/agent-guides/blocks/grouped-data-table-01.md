---
schema_version: 1
name: grouped-data-table-01
kind: block
status: stable
summary: 通用单层分组表格，支持独立展开、组内预览、完整数据搜索筛选和稳定记录计数。
registry_import: "@/components/blocks/grouped-data-table-01"
source: packages/blocks/src/application/grouped-data-table-01/grouped-data-table.tsx
types: packages/blocks/src/application/grouped-data-table-01/grouped-data-table-types.ts
registry: packages/blocks/registry.json
related: [data-table, container, badge, input-group, select]
---

# 分组表格

React data-block，用现有 Container / DataTable / Badge / InputGroup / Select 组合嵌入式分组表格，不创建应用外壳。核心支持任意业务列，不依赖具体业务字段，不自动注入演示数据。

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import { GroupedDataTable } from "@/components/blocks/grouped-data-table-01";

type Resource = { id: string; name: string; kind: string };
const columns: ColumnDef<Resource, unknown>[] = [
  { accessorKey: "name", header: "资源" },
  { accessorKey: "kind", enableHiding: false },
];
const data: Resource[] = [{ id: "infer-atlas-chat", name: "Atlas Chat · 32B", kind: "inference" }];

export function ResourceGroups() {
  return <GroupedDataTable data={data} columns={columns} groupBy="kind"
    getRowId={(item) => item.id}
    groups={[{ value: "inference", label: "模型推理", color: "violet" }]} />;
}
```

data 必须是完整的客户端记录集；groupBy 为分组列 ID，值使用稳定字符串。getRowId 必需且须唯一，不能使用行位置或翻译后的名称。groups 的顺序定义展示顺序，定义包含 value / label / description / color；未知值依然显示。分类色使用现有 Badge 色；业务状态使用 Badge status。分组列通过 groupedColumnMode="remove" 不显示在数据列中，建议设置 enableHiding=false，避免列视图出现无效开关。

默认全部展开；previewRowCount 默认 3，非正数归一到 1，非有限值归一到 3。组内更多状态按分组 ID 保存，搜索和刷新不会重置已显示更多的意愿。expanded / defaultExpanded / onExpandedChange 支持受控与非受控展开。受控更新只发出 TanStack updater，等待宿主传回新状态。更换整个业务数据域时可由宿主更换 React key，避免继承上一个工作区的查询/展示状态。

搜索与 renderFilters 组成的列筛选作用于全部记录。组计数、底部计数和 renderSummary 的 rows 都在折叠/预览前计算，不包含合成组标题。组内排序不改变 groups 配置的分组顺序。manualPagination=true 与 showPagination=false 禁用底层分页和分页控件，不能仅隐藏控件。单页远程数据不能冒充完整分组；后端分页、分组懒加载和多层分组不属于这个 Block。多层资源树使用 resource-cost-01；组件级多列分组可直接使用 DataTable。

state 为 ready / loading / error。加载使用现有按列 Skeleton；错误展示 errorMessage 和可选 onRetry。空数据与无匹配结果分别展示 Empty；清空筛选同时清除搜索和列筛选。actions / onRowActivate / activeRowId / renderFilters / renderSummary 是公开业务入口，不提供假的 CRUD 回调。行内控件和分组按钮不会触发行激活。

labels 支持 Block 文案覆盖，导出 groupedDataTableZhLabels / groupedDataTableEnLabels。宿主提供的 columns / renderFilters 内，分别通过 DataTableColumnHeader.labels 和 DataTableFacetedFilter.labels.clearFilters 本地化排序与筛选操作；Block 不改写宿主列定义。表格密度采用 DataTable 的公开 density 配方，不从 Block 用后代选择器修改行高或单元格。窄屏工具栏换行，DataTable 拥有横向滚动。组头与组尾跨列数随可见列变化；分组按钮保留 aria-expanded 与键盘焦点。

文档示例按模型推理、模型训练、GPU 算力、云主机、数据存储分组，展示云平台、所属项目、区域、容量、利用率和运行状态。groupedDataTableDemoItems 单独导出，服务名称、配置、容量与利用率均为模拟数据，不代表云平台实际产品规格或可用资源。示例添加只操作本地清单，详情为只读 Dialog；真实查询、权限和云平台接入由宿主管理。正式依赖只包含核心所使用的现有组件。
