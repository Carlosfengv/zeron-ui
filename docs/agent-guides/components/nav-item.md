---
schema_version: 1
name: nav-item
kind: component
status: stable
locale: zh-CN
summary: 路由链接与本地动作的语义适配
package_import: "@zeron/ui/nav-item"
registry_import: "@/components/ui/nav-item"
source: packages/ui/src/components/nav-item.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: ["nav-menu", "sidebar"]
---

# nav-item

## 关键契约

- 默认 trigger 是 a：真正页面导航必须提供 href，Next 路由通过 render={<Link href="..." />} 接入。
- 本地状态切换用 render={<button type="button" />}；不要用无 href 的 a 加外层 onClick 冒充可操作导航。
- NavItemLeading/Content/Label/Badge 负责内部排列，业务只供给内容、值、权限和路由。
- active 支持 standalone；NavMenu 下优先由 activeValue 统一选择。standalone 并非错误，但不是标准导航组的相同效果。

## 最小正确组合

工作区 import 展示公开 API；消费者使用实际安装别名。以下例子完整定义业务输入，不代表已经接入后端。

```tsx
import Link from "next/link";
import { NavItem, NavItemTrigger, NavItemContent, NavItemLabel } from "@zeron/ui/nav-item";
export function OrdersLink({ active }: { active: boolean }) {
  return <NavItem value="orders" active={active}><NavItemTrigger render={<Link href="/orders" />}><NavItemContent><NavItemLabel>订单</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>;
}
export function LocalAction({ onSelect }: { onSelect: () => void }) {
  return <NavItem value="settings"><NavItemTrigger render={<button type="button" />} onClick={onSelect}><NavItemContent><NavItemLabel>设置</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>;
}
```

## 业务适配与样式边界

菜单名称、稳定值、路由、账户数据和权限条件由项目维护；接口、筛选和请求状态在业务页面或数据适配器接入。公开 props/slots/render 承接这些变化，不修改受管理组件内部实现。

控件 size/variant、内容 surface、focus/disabled/loading 和交互反馈由组件拥有。宽度与业务内容排列可按公开契约调整；不要逐处覆盖颜色、内边距、圆角、阴影或内部 data-slot。品牌、字体与图标通过已支持的主题/provider 入口统一配置。能力不足时先记录实际公开 API 的缺口，再实现最小业务组合。

## 浏览器验收

验证桌面与手机、长中文标签、折叠/展开和键盘路径；导航必须改变正确业务内容，异步/权限状态不能只演示选中样式。确认图标/标签对齐、滚动归属和弹层焦点。页面任务通过同版本 task-context 入口获取必要组合规则，消费者自查见 consumer-verification；未运行状态如实记录。
