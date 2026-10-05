---
schema_version: 1
name: page-layout
kind: component
status: stable
locale: zh-CN
summary: 在现有应用外壳内组合页面标题、操作、内容与辅助栏，明确尺寸和滚动归属。
package_import: "@zeron/ui/page-layout"
registry_import: "@/components/ui/page-layout"
source: packages/ui/src/components/page-layout.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [app-shell, resource-detail-layout, button]
---

# PageLayout

## 布局归属

保留宿主 AppShell、导航与路由。PageLayout 是页面区域，不是替代整个应用的外壳。先确定宿主高度和滚动策略，再选择组合；只导入 PageLayout 不等于采用完整标题与内容结构。

## 公共契约

- `size` 为 sm、md、lg、full；默认 full。`gutter` 为 default 或 none。
- PageHeader 组合 PageHeaderContent 和 PageActions。标题与描述先放入同一个文本 div，再放入 PageHeaderContent，不能让二者成为 flex 并排兄弟。
- PageTitle 是 h1，页面保留单一主标题。不传 className 时使用紧凑标题样式；传入 className 会启用 text-heading，不能为一点布局变化无意扩大资源标题。
- PageContent 是受限内容容器；PageContentHeader 保留操作／子导航；PageBody 默认负责内部纵向滚动。
- PageSidebar 必须与 PageContent 成为 PageLayout 的直接子项；其 width 控制桌面栏宽，lg 以下堆叠。
- PageColumns 的直接子项是 PagePrimary、PageAside；`columnsAt` 为 lg／xl，`asideSide` 为 left／right，`asideWidth` 表示桌面辅助栏宽。辅助内容需有可访问名称。

## 有界页面组合

宿主必须提供可用高度；以下示例不创建另一套 AppShell。内容通过 children 接入。

```tsx
import type { ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { PageLayout, PageHeader, PageHeaderContent, PageTitle, PageDescription, PageActions, PageContent, PageBody } from "@zeron/ui/page-layout";
export function ResourcePage({ children, canCreate, onCreate }: {
  children: ReactNode; canCreate: boolean; onCreate: () => void;
}) {
  return <PageLayout size="full" gutter="default">
    <PageHeader>
      <PageHeaderContent><div className="min-w-0"><PageTitle>资源</PageTitle><PageDescription>管理当前工作区的资源。</PageDescription></div></PageHeaderContent>
      <PageActions><Button type="button" disabled={!canCreate} onClick={onCreate}>创建资源</Button></PageActions>
    </PageHeader>
    <PageContent><PageBody>{children}</PageBody></PageContent>
  </PageLayout>;
}
```

## 滚动与状态

有界应用使用 PageBody 的内部滚动时，不再给同一内容加第二个 overflow-y 容器。文章型页面若采用文档滚动，则明确取消固定高度约束并保留一个文档滚动拥有者，不照搬上面的有界结构。

加载、空、错误、无权限内容放进选定内容区域，标题／筛选上下文按任务保留。动作由真实权限与路由回调管理，布局本身不实现读取、创建或分页。

## 验收

检查一个 h1、标题与描述的组合、长标题、操作折行、窄屏栏堆叠、键盘导航、滚动容器高度及页面返回行为。使用公开布局与语义 tokens，不通过全局 CSS 重建标题栏。示例类型由 `agents:guides:examples:check` 验证；这些布局与行为检查仍需运行页面。消费者以实际安装别名和源码为准。

## 默认样式与订单业务适配

PageContent 默认拥有 floating surface、边框和圆角；不要用 bg-surface-base 或第二层 Card 外框抵消内容与宿主的视觉层次。PageTitle 默认紧凑样式适合资源页面，按任务选择公开参数，不为排列调整重设字体。

将资源列表改为订单列表时，在项目列配置提供订单编号、客户、金额、状态；在数据适配器将搜索/状态/分页映射到接口参数，并供给 loading/error/empty；权限决定可见操作，服务端验证授权。已有 AppShell 和主题保留，PageLayout/PageContent/PageBody 保留布局与滚动职责。业务层允许组合 Input/Select/Button，不自行重造控件状态样式。
