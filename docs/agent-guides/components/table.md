---
schema_version: 1
name: table
kind: component
status: stable
summary: 可组合的语义表格，支持默认或带框外观、紧凑排版、邻近悬停与骨架表体。
package_import: "@zeron/ui/table"
registry_import: "@/components/ui/table"
source: packages/ui/src/components/table.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related:
  - markdown
  - data-table
  - skeleton
---

# Table

## Installation

```bash
npx zeron-ui add table
```

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@zeron/ui/table";

export function ContentTable() {
  return (
    <Table variant="bordered" size="sm">
      <TableHeader><TableRow><TableHead>Surface</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>Chat Thread</TableCell><TableCell>Ready</TableCell></TableRow></TableBody>
    </Table>
  );
}
```

## Core rules

- 组合 TableHeader、TableBody、TableRow、TableHead、TableCell，保留原生表格语义与直接行/单元格关系。TableSkeletonBody 用于加载表体。
- variant 默认为 plain，保留原有无框样式；bordered 在组件层提供圆角外框、表头背景、高对比正文和局部横向滚动。
- size 默认为 md，使用标准 body 排版；sm 使用紧凑 label 排版，表头与表体随同一上下文调整。
- className、style、原生 table 属性和 ref 作用于 table 元素。containerClassName 只用于外层容器的业务布局。
- 分隔线由 TableRow 绘制，TableBody 统一去掉最后一行的底边框；不要在 Markdown 或业务页面复制这些样式。
- TableRow 的 index 仅用于邻近悬停。交互列表提供稳定行索引；表头与静态富文本行可省略 index，不会注册悬停行。
- Markdown 默认复用 bordered + md，使用 text-body / --font-size-body（14px）；列对齐数据通过 TableHead/TableCell 的原生 style 转交，Markdown 本身只控制外部段落间距。
- 加载时保留表头与列结构，用 TableSkeletonBody 替换表体，并由宿主提供 aria-busy、加载文案与真实加载状态。
