---
schema_version: 1
name: resizable
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 支持指针拖拽与键盘调节的无障碍分栏布局组件，用于构建 AI 对话工作区、代码审阅与调用链检查器。
package_import: "@zeron/ui/resizable"
registry_import: "@/components/ui/resizable"
source: packages/ui/src/components/resizable.tsx
registry: packages/ui/registry.json
related:
  - app-shell
  - page-layout
  - artifact-panel
  - chat-thread
---

# Resizable

## 视觉角色与空间配比（Design & Spatial Rules）

- **经典分栏黄金比例**：
  - **AI 对话 + 产物预览工作台（如 `chat-workspace-01`）**：默认左侧会话区占 `38%~45%`，右侧 `ArtifactPanel` 预览画布占 `55%~62%`，并为两侧设置合理的 `minSize`（如不低于 `28%`），防止拖拽过度导致工具栏折行崩坏。
  - **调用链瀑布流 + Span 详情检查器（如 `agent-message-trace-01`）**：主视图占 `60%~65%`，右侧或底部详情检查器占 `35%~40%`。
- **窄屏响应式降级**：`Resizable` 分栏仅适合桌面宽屏（`lg` / `xl` 及以上）；在移动端或窄视口下，应切换为单栏堆叠、底部抽屉或 `Tabs` 视图切换，绝不在 `390px` 手机屏幕上硬挤左右两栏。
- **明确单一滚动归属**：外层 `ResizablePanelGroup` 必须处于有界高度容器内（如 `h-full min-h-0`），由各个 `ResizablePanel` 内部的子区域各自管理纵向滚动。

## Use when

- 用户需要高频对照阅读并自主调节两个相邻工作区（如“对话流 vs 生成文档”、“文件树 vs 编辑器”、“日志表 vs 原始 JSON”）的屏幕占比。

## Do not use when

- 固定比例的常规主辅详情页（如左侧表单 + 右侧固定 `320px` 说明栏）：直接使用 `PageColumns > PagePrimary + PageAside`，无需引入拖拽手柄增加视觉干扰。

## 公共契约与安全定制

- 组合结构为 `ResizablePanelGroup > ResizablePanel + ResizableHandle + ResizablePanel`。
- `ResizableHandle` 内置无障碍焦点环与键盘方向键调节支持，不要移除其可访问性属性或将焦点样式设为 `outline-none`。

## 工作区集成示例

```tsx
import type { ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@zeron/ui/resizable";

export function DesktopInspector({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
    <ResizablePanel id="records" defaultSize="65%" minSize="28%">{list}</ResizablePanel>
    <ResizableHandle withHandle />
    <ResizablePanel id="detail" defaultSize="35%" minSize="24%">{detail}</ResizablePanel>
  </ResizablePanelGroup>;
}
```
