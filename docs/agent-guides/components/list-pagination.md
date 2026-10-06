---
schema_version: 1
name: list-pagination
kind: component
status: stable
typecheck_examples: true
summary: 不依赖表格引擎的受控列表分页；数据、筛选和请求由宿主管理。
registry_import: "@/components/ui/list-pagination"
source: packages/ui/src/components/list-pagination.tsx
types: packages/ui/src/components/list-pagination.tsx
registry: packages/ui/registry.json
related: [button, select, data-table]
---

# ListPagination

```tsx
import { useState } from "react";
import { ListPagination } from "@zeron/ui/list-pagination";

export function PagerPreview() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  return <ListPagination total={21} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPage(0); setPageSize(size); }} />;
}
```

page 为零基索引。total 是筛选后的数量；组件只展示和回调，不请求数据、不切片、不替宿主更新页码。空结果按第 1 页 / 共 1 页展示，四个导航按钮全部禁用。越界 page 按有效页显示，宿主仍须在筛选、条数变化或数据减少时更新自己的页码，不能只修正分页文案。

pageSizeOptions 默认 5 / 10 / 20 / 50，当前自定义条数也会列入。disabled 同时禁用条数选择和四个导航按钮。labels 支持计数、页摘要和所有可访问名称的本地化。

已使用 DataTable 的页面继续用内置 DataTablePagination，它依赖真实 TanStack Table。不要创建伪造 table 对象或类型断言来使用其分页。ListPagination 用于巡检、告警等保留领域行布局的非表格列表，不引入表格引擎。
