---
schema_version: 1
name: app-shell
kind: component
status: stable
locale: zh-CN
summary: 应用外壳与页面布局的归属
package_import: "@zeron/ui/app-shell"
registry_import: "@/components/ui/app-shell"
source: packages/ui/src/components/app-shell.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: ["sidebar", "page-layout", "nav-menu"]
---

# app-shell

## 关键契约

- AppShellSidebar、AppShellHeader、AppShellMain 是 AppShell 的直接 DOM 子级；Fragment 不增加 DOM，真实 div 包装会改变布局。
- 应用已有外壳时复用它，新增页面只接入内容。不要在同一区域嵌套第二套 AppShell 或 main。
- 有界工作区显式提供高度，AppShellMain 允许收缩，PageBody 拥有内容纵向滚动；文档滚动页面采用自己的高度策略。
- Sidebar 可通过直接子级宽度驱动外壳轨道，不同时硬写两套宽度。

## 最小正确组合

工作区 import 展示公开 API；消费者使用实际安装别名。以下例子完整定义业务输入，不代表已经接入后端。

```tsx
import type { ReactNode } from "react";
import { AppShell, AppShellSidebar, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from "@zeron/ui/sidebar";
import { PageLayout, PageHeader, PageHeaderContent, PageTitle, PageContent, PageBody } from "@zeron/ui/page-layout";
export function Workspace({ navigation, children }: { navigation: ReactNode; children: ReactNode }) {
  return <SidebarProvider><AppShell className="h-dvh overflow-hidden">
    <AppShellSidebar><Sidebar className="static h-full"><SidebarContent>{navigation}</SidebarContent></Sidebar></AppShellSidebar>
    <AppShellHeader><SidebarTrigger /></AppShellHeader>
    <AppShellMain className="flex min-h-0 flex-col"><PageLayout>
      <PageHeader><PageHeaderContent><div><PageTitle>资源</PageTitle></div></PageHeaderContent></PageHeader>
      <PageContent><PageBody>{children}</PageBody></PageContent>
    </PageLayout></AppShellMain>
  </AppShell></SidebarProvider>;
}
```

## 业务适配与样式边界

菜单名称、稳定值、路由、账户数据和权限条件由项目维护；接口、筛选和请求状态在业务页面或数据适配器接入。公开 props/slots/render 承接这些变化，不修改受管理组件内部实现。

控件 size/variant、内容 surface、focus/disabled/loading 和交互反馈由组件拥有。宽度与业务内容排列可按公开契约调整；不要逐处覆盖颜色、内边距、圆角、阴影或内部 data-slot。品牌、字体与图标通过已支持的主题/provider 入口统一配置。能力不足时先记录实际公开 API 的缺口，再实现最小业务组合。

## 浏览器验收

验证桌面与手机、长中文标签、折叠/展开和键盘路径；导航必须改变正确业务内容，异步/权限状态不能只演示选中样式。确认图标/标签对齐、滚动归属和弹层焦点。页面任务通过同版本 task-context 入口获取必要组合规则，消费者自查见 consumer-verification；未运行状态如实记录。
