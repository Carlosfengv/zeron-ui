---
schema_version: 1
name: message-navigation
kind: component
status: stable
summary: 紧凑的消息短线导航，支持整轮预览、当前位置和键盘选择。
package_import: "@zeron/ui/message-navigation"
registry_import: "@/components/ui/message-navigation"
source: packages/ui/src/components/message-navigation.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [popover, button, tooltip, chat-message]
---

# MessageNavigation

```bash
npx zeron-ui add message-navigation
```

```tsx
import { useState } from "react";
import { MessageNavigation } from "@zeron/ui/message-navigation";

export function Example() {
  const [activeId, setActiveId] = useState("first");
  const [bookmarked, setBookmarked] = useState(false);
  return <MessageNavigation label="消息" activeId={activeId} onSelect={setActiveId}
    onBookmarkChange={(_id, next) => setBookmarked(next)}
    bookmarkLabels={{ bookmark: "收藏消息", unbookmark: "取消收藏", bookmarked: "已收藏" }}
    items={[{ id: "first", label: "如何优化搜索？", description: "输入即时更新，请求使用防抖。", bookmarked }]} />;
}
```

- items 使用唯一稳定 id、label，可选 description 与 actions；摘要支持 ReactNode，保持简短。actions 用于额外宿主操作。
- 提供 onBookmarkChange 后预览右上角显示标准 Button iconOnly 收藏按钮，并复用 Tooltip。item.bookmarked 完全受控，点击只发出 (id, nextBookmarked)，外部传回新值后才改变显示，不关闭预览或选择消息；省略回调时隐藏按钮。item.bookmarkDisabled 支持保存期间禁用。bookmarkLabels 提供按钮名称及取消收藏提示，bookmarkIcon 可替换默认图标。组件不处理持久化、失败提示或乐观更新。
- activeId 标记当前阅读位置，onSelect 只发出 ID。宿主持有对话数据、滚动容器和跳转后的焦点；组件不会监听页面全局滚动。
- 紧凑短线具有不同的标题长度档位，当前项与预览项变亮、变长；不是数量图表。组件拥有短线、焦点和预览样式，调用者只设置外部位置、最大高度和响应式显隐。
- item.bookmarked=true 时，短线使用品牌色，并在内侧增加圆点，读屏通过 aria-describedby 获知已收藏。当前项及预览项仍会加长，收藏色和圆点同时保留；左右外边缘保持原有对齐。标识仅跟随外部状态，在无 onBookmarkChange 的只读导航中也生效。bookmarkLabels.bookmarked 本地化状态描述；不要通过宿主样式覆盖短线或另加收藏标识。
- align 默认 right，右侧导航的短线共用右边缘；左侧导航设置 align="left"，短线共用左边缘。此属性仅影响短线，不改变预览方向；previewSide 继续独立控制浮层。
- 悬停或聚焦显示左侧问题标题和回复摘要，标题单行省略、摘要最多三行。复用 Popover 的表面、定位、碰撞与关闭行为。previewSide 可改为 right。
- 导航只有一个 Tab 停靠点。上下方向键、Home、End 移动焦点，Enter / Space 选择，Escape 关闭预览。长列表仅滚动自身以显示当前项，不调用 scrollIntoView 滚动宿主。
- label 和 getItemLabel 提供本地化可访问名称，后者索引从零开始。空数据不渲染，不自行选择不存在的 activeId。
- chat-thread-01 使用此组件组合用户轮次与后续回复的预览。窄屏是否展示由宿主负责。
