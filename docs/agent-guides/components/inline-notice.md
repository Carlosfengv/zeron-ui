---
schema_version: 1
name: inline-notice
kind: component
status: stable
locale: zh-CN
summary: 活动、长文案和保留旧数据时的局部提示，默认不实时播报。
package_import: "@zeron/ui/inline-notice"
registry_import: "@/components/ui/inline-notice"
source: packages/ui/src/components/inline-notice.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [alert, badge, button]
---

# InlineNotice

活动、过期、刷新失败与长文案直接使用 InlineNoticeContent。subtle 为默认中性样式；variant="emphasized" 时必须提供 tone：neutral、info、success、warning、danger。正文可换行，包括长标识符。装饰图标使用 aria-hidden，不需要嵌套状态组件。

```tsx
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
export function RefreshNotice() {
  return <InlineNotice variant="emphasized" tone="info"><span aria-hidden="true" className="inline-flex animate-spin motion-reduce:animate-none"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /></svg></span><InlineNoticeContent>正在刷新，保留上次获取的结果。</InlineNoticeContent></InlineNotice>;
}
```

静态提示默认没有实时播报。非紧急动态更新显式添加 role="status"，紧急错误才使用 role="alert"，避免图标、正文与 Badge 同时播报。短状态和单独标记使用 Badge plain，独立区域及完整重试操作使用 Alert。InlineNoticeAction 支持紧凑链接或文字操作，业务请求由宿主负责。

安装使用 `npx zeron-ui add inline-notice`。验收长文案换行、减少动态效果下停止动画、刷新不丢失旧内容和播报归属。
