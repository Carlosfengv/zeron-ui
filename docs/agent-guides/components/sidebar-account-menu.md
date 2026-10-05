---
schema_version: 1
name: sidebar-account-menu
kind: component
status: stable
locale: zh-CN
summary: 账户菜单的数据和行为接入
package_import: "@zeron/ui/sidebar-account-menu"
registry_import: "@/components/ui/sidebar-account-menu"
source: packages/ui/src/components/sidebar-account-menu.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: ["sidebar", "sidebar-identity-row"]
---

# sidebar-account-menu

## 关键契约

- sections/items 的稳定 id、label、disabled、onSelect 由项目供给；权限还需服务端校验。
- compact 明确控制折叠后的头像菜单触发器；抽屉打开时保留完整身份。
- open/onOpenChange 可受控；menuSide/menuAlign 等是公开定位参数，不从全局 CSS 重写弹层定位。
- 账户变更必须更新业务状态和数据服务，不把演示账户名称当作认证结果。

## 最小正确组合

工作区 import 展示公开 API；消费者使用实际安装别名。以下例子完整定义业务输入，不代表已经接入后端。

```tsx
import { SidebarAccountMenu } from "@zeron/ui/sidebar-account-menu";
import { useSidebar } from "@zeron/ui/sidebar";
export function AccountMenu({ onSettings }: { onSettings: () => void }) {
  const { state, isMobile } = useSidebar();
  return <SidebarAccountMenu primary="Carlos" description="当前工作区管理员" compact={state === "collapsed" && !isMobile}
    sections={[{ items: [{ id: "settings", label: "账户设置", onSelect: onSettings }] }]} />;
}
```

## 业务适配与样式边界

菜单名称、稳定值、路由、账户数据和权限条件由项目维护；接口、筛选和请求状态在业务页面或数据适配器接入。公开 props/slots/render 承接这些变化，不修改受管理组件内部实现。

控件 size/variant、内容 surface、focus/disabled/loading 和交互反馈由组件拥有。宽度与业务内容排列可按公开契约调整；不要逐处覆盖颜色、内边距、圆角、阴影或内部 data-slot。品牌、字体与图标通过已支持的主题/provider 入口统一配置。能力不足时先记录实际公开 API 的缺口，再实现最小业务组合。

## 浏览器验收

验证桌面与手机、长中文标签、折叠/展开和键盘路径；导航必须改变正确业务内容，异步/权限状态不能只演示选中样式。确认图标/标签对齐、滚动归属和弹层焦点。页面任务通过同版本 task-context 入口获取必要组合规则，消费者自查见 consumer-verification；未运行状态如实记录。
