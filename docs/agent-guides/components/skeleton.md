---
schema_version: 1
name: skeleton
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 原生绑定语义令牌的加载占位原语，用于保持头像、卡片、表单与表格在加载期间的几何结构稳定。
package_import: "@zeron/ui/skeleton"
registry_import: "@/components/ui/skeleton"
source: packages/ui/src/components/skeleton.tsx
registry: packages/ui/registry.json
related:
  - table
  - data-table
  - card
  - empty
---

# Skeleton

## 视觉角色与空间配比（Design & Spatial Rules）

- **1:1 映射最终版式骨架，杜绝加载跳动（Zero CLS）**：好的 `Skeleton` 设计不是随便画三根横条，而是精确匹配最终内容的容器高度、圆角与栅格列数（例如 4 张 `MetricCard` 加载时渲染 4 个同尺寸卡片骨架）。
- **保留静态表头与框架**：表格或列表加载时，保持外层 `PageHeader`、筛选工具栏以及 `TableHeader` 真实渲染，**只将动态数据区域（如 `TableBody`）替换为骨架行**，让用户立刻看清页面结构。
- **克制的呼吸感**：同一视口内避免超过 3 种不同频率的闪烁动画；`Skeleton` 已内置语义脉冲与 `motion-reduce:animate-none` 无障碍降级。

## Use when

- 页面首次加载数据（`loading` 且 `data === null`）或局部异步卡片尚未返回内容时。

## Do not use when

- 已有旧数据正在后台静默刷新（`refreshing`）：此时应保留现有图表/列表并显示轻量刷新状态，不要把整个屏幕切回空白骨架导致闪屏。
- 按钮提交等微局部瞬时动作：直接使用 `Button` 的 `loading` 属性。

## 公共契约与安全定制

- 通过 `className` 控制几何宽高与圆角（如圆形头像 `size-10 rounded-full`、文本行 `h-4 w-3/4 rounded-md`）；`DataTable` 使用 `isLoading` 和 `loadingRowCount`，按实际列自动渲染占位单元格。使用基础 `Table` 时，在 `TableCell` 中组合 `Skeleton`。
- 不要覆盖 `Skeleton` 的底层背景色与动画令牌。

## 工作区集成示例

```tsx
import { DataTable, type DataTableProps } from "@zeron/ui/data-table";

export function ResourceTable<T>({ table, pending }: { table: DataTableProps<T>["table"]; pending: boolean }) {
  return <DataTable table={table} isLoading={pending} loadingRowCount={5} loadingMessage="正在加载资源" />;
}
```
