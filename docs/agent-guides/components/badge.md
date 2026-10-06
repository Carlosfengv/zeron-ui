---
schema_version: 1
name: badge
kind: component
status: stable
locale: zh-CN
summary: 分类与语义状态标签，支持轻量圆点和高强调状态。
package_import: "@zeron/ui/badge"
registry_import: "@/components/ui/badge"
source: packages/ui/src/components/badge.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [alert, inline-notice]
---

# Badge

`color` 表达模型类型、供应商、分类等身份；`status` 表达 danger、warning、success、info、neutral，优先于分类色。启用通常为 info，停用为 neutral，不能把停用当成失败。业务的 P0/P1、部署就绪和检查结果仍由各业务层映射。

solid、dot、strong、plain 均支持 status。strong 使用专属的语义填充和前景配对，浅色、深色的默认配色对比度均至少 4.5:1。有边框的状态变体默认将对应语义边框颜色以 28% 不透明度与透明色混合。禁止通过 className 覆盖内部状态颜色。分类 strong 与自定义分类色继续兼容；自定义颜色和主题需要宿主验证对比度。

Badge 默认没有实时播报。新发生的操作结果需要通知辅助技术时，选择一个明确的反馈 owner，避免 Badge 和 InlineNotice 同时播报。普通行短状态使用 Badge 的 plain 变体；活动与长文案使用 InlineNotice，强调区域使用 Alert。

```tsx
import { Badge } from "@zeron/ui/badge";
export function StateLabels() {
  return <div><Badge status="neutral">已停用</Badge><Badge status="info">已启用</Badge><Badge variant="strong" status="danger">严重 · P1</Badge><Badge color="violet">模型</Badge></div>;
}
```

## 轻量状态

plain 无背景、边框和水平内边距；默认显示圆点，leadingIcon 替换圆点。省略 children 可单独显示标记；装饰标记设置 aria-hidden，需要读取的独立标记设置 role="img" 和 aria-label。图标只表达外观，不自动旋转或播报。

```tsx
import { Badge } from "@zeron/ui/badge";
export function HealthMarker() {
  return <div><Badge variant="plain" status="success">正常</Badge><Badge variant="plain" status="danger" role="img" aria-label="失败" /></div>;
}
```
