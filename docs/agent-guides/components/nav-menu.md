---
schema_version: 1
name: nav-menu
kind: component
status: stable
locale: zh-CN
summary: 导航组的选中状态与键盘模式
package_import: "@zeron/ui/nav-menu"
registry_import: "@/components/ui/nav-menu"
source: packages/ui/src/components/nav-menu.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: ["nav-item", "sidebar"]
---

# nav-menu

## 关键契约

- NavMenu 包含 NavItem，以 activeValue 表示当前目标；业务回调或路由拥有状态变化。
- keyboardNavigation="roving" 提供组内方向键移动与单一 Tab 停留点；"tab" 用于逐项 Tab 的导航需求，以安装类型为准。
- 通过 aria-label 命名每个导航组，使用支持的 orientation/variant，不自己复制选中指示器。
- NavItem standalone 可以独立工作，但采用不同的悬停/选中反馈。官方分组侧栏优先采用 NavMenu。

## 最小正确组合

工作区 import 展示公开 API；消费者使用实际安装别名。以下例子完整定义业务输入，不代表已经接入后端。

```tsx
import { NavMenu } from "@zeron/ui/nav-menu";
import { NavItem, NavItemTrigger, NavItemContent, NavItemLabel } from "@zeron/ui/nav-item";
export function SectionNavigation({ active, onSelect }: { active: string; onSelect: (value: string) => void }) {
  return <NavMenu aria-label="工作区导航" activeValue={active} keyboardNavigation="roving">
    <NavItem value="resources"><NavItemTrigger render={<button type="button" />} onClick={() => onSelect("resources")}><NavItemContent><NavItemLabel>资源</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
    <NavItem value="settings"><NavItemTrigger render={<button type="button" />} onClick={() => onSelect("settings")}><NavItemContent><NavItemLabel>设置</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
  </NavMenu>;
}
```

## 业务适配与样式边界

菜单名称、稳定值、路由、账户数据和权限条件由项目维护；接口、筛选和请求状态在业务页面或数据适配器接入。公开 props/slots/render 承接这些变化，不修改受管理组件内部实现。

控件 size/variant、内容 surface、focus/disabled/loading 和交互反馈由组件拥有。宽度与业务内容排列可按公开契约调整；不要逐处覆盖颜色、内边距、圆角、阴影或内部 data-slot。品牌、字体与图标通过已支持的主题/provider 入口统一配置。能力不足时先记录实际公开 API 的缺口，再实现最小业务组合。

## 浏览器验收

验证桌面与手机、长中文标签、折叠/展开和键盘路径；导航必须改变正确业务内容，异步/权限状态不能只演示选中样式。确认图标/标签对齐、滚动归属和弹层焦点。页面任务通过同版本 task-context 入口获取必要组合规则，消费者自查见 consumer-verification；未运行状态如实记录。
