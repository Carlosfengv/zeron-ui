---
schema_version: 1
name: top-nav
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 组合品牌标识、水平主导航与右侧全局动作区的顶部导航栏，常与堆叠式 AppShell 配合使用。
package_import: "@zeron/ui/top-nav"
registry_import: "@/components/ui/top-nav"
source: packages/ui/src/components/top-nav.tsx
registry: packages/ui/registry.json
related:
  - app-shell
  - nav-menu
  - nav-item
  - sidebar
---

# TopNav

## 视觉角色与空间配比（Design & Spatial Rules）

- **轻量平级导航的首选壳层**：当产品一级频道在 `3~6` 个以内、且不需要深层树状目录时，使用 `<AppShell layout="stacked">` 搭配 `TopNav`（如开发者门户、模型广场、文档站或轻量工作台 `top-nav-app-shell-01`），把 100% 屏幕宽度留给下方内容区。
- **三段式对齐法则（`navigationAlign`）**：
  - `center`（默认）：左品牌（`TopNavBrand`）、中主导航（`TopNavNavigation`）、右工具与用户操作（`TopNavActions`），视觉最平衡。
  - `left`：主导航紧随品牌标识右侧，适合右侧需要放置搜索框、环境切换器等多个辅助控件的场景。
- **导航项数量控制**：水平主导航显式条目不超过 `6` 项；超出项使用内置的 `TopNavItemMenu`（“更多 ▾”下拉浮层）收纳，防止在中等宽度屏幕挤压折行。

## Use when

- 构建顶部水平导航架构的应用外壳或频道头部。

## Do not use when

- 拥有 7 个以上一级模块或多层嵌套子菜单的重型运维/企业后台：优先使用带 `Sidebar` 的侧栏式 `AppShell`。
- 页面内容区内部的局部视图切换：使用 `PageSubnav` 或 `Tabs`。

## 公共契约与安全定制

- 标准组合为 `TopNav > TopNavBrand + TopNavNavigation (NavMenu) + TopNavActions`；保持默认的 `48px`（`min-h-12`）紧凑高度与 `2px` 激活下划线契约。

## 工作区集成示例

```tsx
import type { ReactNode } from "react";
import { TopNav, TopNavActions, TopNavBrand, TopNavNavigation } from "@zeron/ui/top-nav";

export function WorkspaceNav({ navigation, account }: { navigation: ReactNode; account: ReactNode }) {
  return <TopNav navigationAlign="left">
    <TopNavBrand><a href="/">工作区</a></TopNavBrand>
    <TopNavNavigation>{navigation}</TopNavNavigation>
    <TopNavActions>{account}</TopNavActions>
  </TopNav>;
}
```
