---
schema_version: 1
name: popover
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 锚定于触发控件的碰撞感知悬浮面板，具有液态锚点展开动画与 Floating 表面上下文。
package_import: "@zeron/ui/popover"
registry_import: "@/components/ui/popover"
source: packages/ui/src/components/popover.tsx
registry: packages/ui/registry.json
related:
  - dropdown
  - dialog
  - tooltip
---

# Popover

## 视觉角色与空间配比（Design & Spatial Rules）

- **轻量就地展开，不打断心流**：`Popover` 用于承载与触发按钮强关联的**小型交互面板**（如自定义筛选条件、取色器、日期范围面板、轻量属性设置或二次确认小卡片）。
- **尺寸与内容密度上限**：面板宽度建议控制在 `240px~380px`（`w-64` 至 `w-96`）之间；内部表单控件不超过 `3~4` 项，严禁在 `Popover` 内塞入多列复杂表格或长篇文档。
- **表面层级自动继承**：`PopoverContent` 已内置 `floating` 表面与 `0.5px` 语义边框，内部无需再嵌套带边框的 `Card` 或 `Container`。

## Use when

- 点击控件后需要就地展示可交互的轻量表单、筛选编辑器、状态详情或色彩/时间面板。

## Do not use when

- 纯动作命令菜单列表（如“编辑 / 复制 / 删除”）：使用 `Dropdown`（内置菜单键盘导航与邻近悬停）。
- 仅在悬停/聚焦时显示的纯文本简短说明（无交互控件）：使用 `Tooltip`。
- 需要阻断背景操作、承载复杂表单或重要破坏性确认的独立任务：使用 `Dialog`。

## 公共契约与安全定制

- 组合结构为 `Popover > PopoverTrigger + PopoverContent`；支持受控 `open` / `onOpenChange` 与 `side` / `align` 碰撞对齐。
- 保持内置的弹簧展开与退场提速过渡，不要用自定义 `transition-all` 覆盖浮层定位动画。

## 工作区集成示例

```tsx
import { Button } from "@zeron/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";

export function RegionDetails({ region }: { region: string }) {
  return <Popover>
    <PopoverTrigger render={<Button type="button" variant="secondary">区域详情</Button>} />
    <PopoverContent side="bottom" align="start">当前区域：{region}</PopoverContent>
  </Popover>;
}
```
