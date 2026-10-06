---
schema_version: 1
name: alert
kind: component
status: stable
locale: zh-CN
summary: 可组合的请求失败和区域提示，使用现有标题、描述及宿主操作插槽。
package_import: "@zeron/ui/alert"
registry_import: "@/components/ui/alert"
source: packages/ui/src/components/alert.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [empty, inline-notice, button]
---

# Alert

首次请求失败或需要独立提示区域时，直接组合 AlertTitle、AlertDescription、AlertIcon 和 AlertAction。成功请求返回空集合使用 Empty；刷新失败且已有快照时保留数据，用 InlineNotice 反馈。

status 支持 default、neutral、info、warning、danger。danger 默认 role="alert"，其他默认 role="status"；静态示例和旧错误使用 role="group"。新错误只选择一个播报 owner。组件不发请求，也不拥有重试状态。

```tsx
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@zeron/ui/alert";
import { Button } from "@zeron/ui/button";
export function RequestFailure({ pending, retry }: { pending: boolean; retry: () => void }) {
  return <Alert status="danger" role="group"><AlertTitle>数据加载失败</AlertTitle><AlertDescription>检查连接后重新加载。</AlertDescription><AlertAction><Button loading={pending} onClick={retry}>重新加载</Button></AlertAction></Alert>;
}
```

安装使用 `npx zeron-ui add alert`。页面、面板的占位高度与外部布局由业务容器拥有，不需要额外的失败状态组件。验收重试等待、防重复请求、失败/空结果区别、窄屏操作换行和播报次数。
