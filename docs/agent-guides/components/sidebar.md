---
schema_version: 1
name: sidebar
kind: component
status: stable
locale: zh-CN
summary: 标准分组侧栏与响应式组合
package_import: "@zeron/ui/sidebar"
registry_import: "@/components/ui/sidebar"
source: packages/ui/src/components/sidebar.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: ["app-shell", "nav-menu", "nav-item", "sidebar-identity-row", "sidebar-account-menu"]
---

# sidebar

## 关键契约

- SidebarProvider 拥有展开、mobileOpen 和 breakpointBehavior；默认 drawer，支持 collapse。当前断点为 1279px 以下，以安装版本常量为准。
- Sidebar 的 collapsible 支持 icon/offcanvas/none；width/collapsedWidth/mobileWidth 用公开参数设置。
- Header/Content/Footer 组合身份、分组导航与账户操作；NavMenu 提供官方导航组反馈，不能用一组独立 NavItem 假定相同效果。
- SidebarContent 的 className 作用于外层 ScrollArea，contentClassName 作用于内部内容层。内部已有间距，调整其参数时不要再叠加外层 padding 和组 margin。
- 折叠头像账户菜单应根据 useSidebar 设置 compact，参见 SidebarAccountMenu 指南。

## 最小正确组合

工作区 import 展示公开 API；消费者使用实际安装别名。以下例子完整定义业务输入，不代表已经接入后端。

```tsx
import { useState } from "react";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarTrigger, useSidebar } from "@zeron/ui/sidebar";
import { SidebarIdentityRow, SidebarIdentityAvatar } from "@zeron/ui/sidebar-identity-row";
import { SidebarAccountMenu } from "@zeron/ui/sidebar-account-menu";
import { NavMenu } from "@zeron/ui/nav-menu";
import { NavItem, NavItemTrigger, NavItemLeading, NavItemContent, NavItemLabel } from "@zeron/ui/nav-item";
import { useIcon } from "@zeron/icons/context";
function NavigationPanel({ active, onNavigate, onAccount }: { active: string; onNavigate: (value: string) => void; onAccount: () => void }) {
  const { state, isMobile, closeMobile } = useSidebar();
  const Folder = useIcon("folder"), Settings = useIcon("settings");
  const compact = state === "collapsed" && !isMobile;
  const navigate = (value: string) => { onNavigate(value); closeMobile(); };
  return <Sidebar collapsible="icon" className="static h-full" ariaLabel="应用导航">
    <SidebarHeader>{compact ? <SidebarIdentityAvatar tone="brand" aria-label="工作区">Z</SidebarIdentityAvatar> : <SidebarIdentityRow primary="工作区" leading={<SidebarIdentityAvatar tone="brand">Z</SidebarIdentityAvatar>} />}</SidebarHeader>
    <SidebarContent><SidebarGroup><SidebarGroupLabel>管理</SidebarGroupLabel><SidebarGroupContent>
      <NavMenu aria-label="管理导航" activeValue={active} keyboardNavigation="roving">
        <NavItem value="resources"><NavItemTrigger render={<button type="button" />} tooltip="资源" onClick={() => navigate("resources")}><NavItemLeading><Folder aria-hidden /></NavItemLeading><NavItemContent><NavItemLabel>资源</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
        <NavItem value="settings"><NavItemTrigger render={<button type="button" />} tooltip="设置" onClick={() => navigate("settings")}><NavItemLeading><Settings aria-hidden /></NavItemLeading><NavItemContent><NavItemLabel>设置</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
      </NavMenu>
    </SidebarGroupContent></SidebarGroup></SidebarContent>
    <SidebarFooter><SidebarAccountMenu primary="Carlos" description="管理员" compact={compact} sections={[{ items: [{ id: "account", label: "账户设置", onSelect: () => { onAccount(); closeMobile(); } }] }]} /></SidebarFooter>
  </Sidebar>;
}
export function NavigationExample({ onAccount }: { onAccount: () => void }) {
  const [active, setActive] = useState("resources");
  return <SidebarProvider><div className="flex h-96 min-w-0 overflow-hidden">
    <NavigationPanel active={active} onNavigate={setActive} onAccount={onAccount} />
    <section className="min-w-0 flex-1" aria-label="当前内容"><SidebarTrigger /><p>{active === "resources" ? "资源内容" : "设置内容"}</p></section>
  </div></SidebarProvider>;
}
```

## 业务适配与样式边界

菜单名称、稳定值、路由、账户数据和权限条件由项目维护；接口、筛选和请求状态在业务页面或数据适配器接入。公开 props/slots/render 承接这些变化，不修改受管理组件内部实现。

控件 size/variant、内容 surface、focus/disabled/loading 和交互反馈由组件拥有。宽度与业务内容排列可按公开契约调整；不要逐处覆盖颜色、内边距、圆角、阴影或内部 data-slot。品牌、字体与图标通过已支持的主题/provider 入口统一配置。能力不足时先记录实际公开 API 的缺口，再实现最小业务组合。

## 浏览器验收

验证桌面与手机、长中文标签、折叠/展开和键盘路径；导航必须改变正确业务内容，异步/权限状态不能只演示选中样式。确认图标/标签对齐、滚动归属和弹层焦点。页面任务通过同版本 task-context 入口获取必要组合规则，消费者自查见 consumer-verification；未运行状态如实记录。
