---
schema_version: 1
name: dropdown
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 带邻近悬停高亮与弹簧过渡的上下文命令菜单，用于收敛次要操作与行级动作。
package_import: "@zeron/ui/dropdown"
registry_import: "@/components/ui/dropdown"
source: packages/ui/src/components/dropdown.tsx
registry: packages/ui/registry.json
related:
  - button
  - button-group
  - popover
  - select
---

# Dropdown

## 视觉角色与空间配比（Design & Spatial Rules）

- **操作收敛的黄金利器**：当页头、卡片头或表格行操作超过 `2~3` 个时，保留唯一核心动作外露，将其余低频或辅助操作（如“导出 CSV”、“复制 ID”、“归档”、“删除”）收纳进 `Dropdown`（通常由 `iconOnly` 的更多按钮触发），保持界面清爽。
- **分组与危险项隔离**：菜单项超过 5 个时，按语义分组；不可逆的高风险操作（如“删除资源”）置于菜单最底部，帮助用户建立稳定的肌肉记忆并防止误触。

## Use when

- 表格行末尾的“更多操作”菜单、用户头像账户菜单、`ButtonGroup` 的 Split Button 下拉动作或工具栏命令列表。

## Do not use when

- 在表单中选择并回显一个持久化字段值：使用 `Select` 或 `Combobox`。
- 浮层内需要放置输入框、滑块等非菜单类自由交互组件：使用 `Popover`。

## 公共契约与安全定制

- 使用 `DropdownMenu` 包含 `DropdownTrigger` 和 `DropdownContent`，在 `DropdownContent` 中放置从 `menu-item` 导入的 `MenuItem`（及分组/分割线子组件）构建；内置完整的方向键导航与邻近悬停背景跟随。
- 图标按钮作为 `DropdownTrigger` 时必须提供清晰的 `aria-label`（如 `aria-label="更多操作"`）。

## 工作区集成示例

```tsx
import { Button } from "@zeron/ui/button";
import { DropdownMenu, DropdownTrigger, DropdownContent } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";

export function ExportMenu({ onExport }: { onExport: () => void }) {
  return <DropdownMenu>
    <DropdownTrigger render={<Button type="button" variant="secondary">更多操作</Button>} />
    <DropdownContent align="end">
      <MenuItem index={0} label="导出 CSV" onSelect={onExport} />
    </DropdownContent>
  </DropdownMenu>;
}
```
