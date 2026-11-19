---
schema_version: 1
name: container
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 具有抬升外框（Raised）与悬浮内容体（Floating）的聚合工作区容器，支持可选顶栏与底栏。
package_import: "@zeron/ui/container"
registry_import: "@/components/ui/container"
source: packages/ui/src/components/container.tsx
registry: packages/ui/registry.json
related:
  - card
  - page-layout
  - surfaces
---

# Container

## 视觉角色与空间配比（Design & Spatial Rules）

- **定位为“独立工作台区块”，而非通用 `div`**：`Container` 通过外层 `surface-raised` 底座托起内层 `surface-floating` 的 `ContainerBody`，具有强烈的立体视觉权重。一屏页面通常只需 `1~2` 个主 `Container`（如代码预览舱、交互式配置台、分步表单面板）。
- **禁止与 `PageContent` 或 `Card` 同层套娃**：不要为了加内边距而在每个普通段落外包裹 `Container`；普通分组优先使用间距或 `Card`。
- **内部滚动边界**：仅当需要将内容高度限制在固定视窗内时，才为 `ContainerBody` 指定 `maxHeight`；此时 `ContainerBody` 成为明确的局部纵向滚动拥有者，内部不要再套第二层滚动条。

## Use when

- 需要清晰的“外框顶栏（`ContainerHeader`）+ 独立悬浮主体（`ContainerBody`）+ 底部摘要/动作栏（`ContainerFooter`）”三段式立体层次。
- 承载终端命令行面板、交互式预览画布、可编辑规则面板或带汇总底栏的复合表单。

## Do not use when

- 页面级主框架与响应式主辅分栏：使用 `PageLayout`、`PageContent` 与 `PageColumns`。
- 轻量平铺的列表项或信息展示卡：使用 `Card` 或 `DetailList`。

## 公共契约与安全定制

- 结构槽位依次为 `Container > ContainerHeader + ContainerBody + ContainerFooter`；`ContainerHeader` 与 `ContainerFooter` 为可选槽位。
- 保持组件内置的 `SurfaceProvider` 层级传递，确保放置在 `ContainerBody` 内的输入控件、表格与徽章自动获得正确的悬浮表面对比度。

## 工作区集成示例

```tsx
import type { ReactNode } from "react";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";

export function PreviewPanel({ children, status }: { children: ReactNode; status: string }) {
  return <Container>
    <ContainerHeader>预览</ContainerHeader>
    <ContainerBody maxHeight="32rem">{children}</ContainerBody>
    <ContainerFooter>{status}</ContainerFooter>
  </Container>;
}
```
