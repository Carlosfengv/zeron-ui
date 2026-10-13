---
schema_version: 1
name: resource-cost-01
kind: block
status: stable
summary: GPU 集群与云主机的多层级资源成本表，支持展开深度、祖先路径搜索、资源状态筛选和完整成本汇总。
registry_import: "@/components/blocks/resource-cost-01"
source: packages/blocks/src/application/resource-cost-01/resource-cost.tsx
types: packages/blocks/src/application/resource-cost-01/resource-cost-types.ts
registry: packages/blocks/registry.json
related: [container, data-table, chart, badge, input-group]
---

# 算力资源成本

React data-block，用 Container / Header / Body / Footer 和 DataTable 组合一块成本工作区，不创建应用外壳。适合 GPU、云主机、存储与网络的月度资源规划。DonutSummary 表示父级占完整清单总额的比例，弧线用 fg-default，余量为现有 muted；状态使用 Badge 的语义色，不创建新的调色板。

```tsx
import { ResourceCost, resourceCostDemoItems } from "@/components/blocks/resource-cost-01";

export function ComputeInventory() {
  return <ResourceCost items={resourceCostDemoItems} description="Atlas AI · 月度资源规划" currency="CNY" locale="zh-CN" defaultDepth={2} />;
}
```

items 为任意深度树。每个 id 是全树唯一的非空字符串，kind / availability 使用公开枚举；quantity 非负有限，readyInDays 非负整数。叶子需要非负有限 unitCost（主货币单位/月）；父级使用 children 汇总而忽略自有单价。货币精度从 Intl 获取，输入 Number 的十进制表示转换为整数有理数，以 HALF_UP 逐叶舍入后用整数最小货币单位汇总，避免 1.005 的二进制舍入误差；不会将父子金额重复求和。森林总額也检查安全精度，无法精确表示时拒绝计算。单价保留最多 20 位小数，汇总按币种精度显示。非法数据或币种/语言配置展示错误且禁用导出；loading 优先显示占位，直到 ready 才校验资源。当前适用于月度固定单价估算，不实现阶梯价、税费、折扣、汇率或真实账单。

父级 readyInDays 取子树最大值，状态取 limited > provisioning > reserved > available；风险数量只计 limited / provisioning 叶子项。汇总资源数为叶子条目数，数量字段可表示 GPU 台数、云主机或存储计价单位。零成本保留零值且不产生伪造占比。

DataTable 本身透传 getSubRows / getExpandedRowModel / state.expanded / onExpandedChange，此 Block 使用这些公开配置和稳定 id；manualPagination=true 与 showPagination=false 保证资源树完整呈现，不截断子级。defaultDepth 默认 2；支持 0（收起）、1、2、all 预设，行按钮可独立展开。defaultExpanded 可按稳定资源 id 配置初始展开，优先于 defaultDepth；文档 Demo 仅展开 training / h100-pool。Button 保留焦点与 aria-expanded；表格维持原生 table 语义。较窄布局让工具栏换行，DataTable 拥有横向滚动。

搜索匹配 name / code；匹配父级会包含符合状态的后代。状态筛选保留匹配叶子的父级路径。筛选自动展开；层级预设对刷新后的新资源 id 同样生效，手动展开则保留按 id 的状态。成本与占比始终使用筛选前的完整树，footer 显示该口径，不能将过滤后的父节点金额再次聚合。onExport 接收完整计算树；onInspect 接收完整节点（不受筛选裁剪）。省略任一回调会隐藏对应入口。工具栏使用默认 32px 控件，ContainerBody 为 p-3；DataTable 不渲染无分页/选中操作的空底部容器。

state 为 ready / loading / error；errorMessage 和 onRetry 由宿主管理。支持空数据与搜索无结果。title / description / summaryLabel / labels / locale / currency 为公开适配入口；resourceCostEnLabels 提供英文默认文案。示例数据与核心分离，宿主负责真实查询、计费服务、权限及导出。

文档 Demo 使用固定 CNY 示例费率，12 条叶子资源、总计 164840/月、最长 7 天、2 个风险资源。示例导出 JSON 标记 demonstration=true。保持现有 Container 表面、DataTable 几何和公共图标插槽，不用后代选择器覆盖内部控件。
