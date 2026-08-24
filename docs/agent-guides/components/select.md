---
schema_version: 1
name: select
kind: component
status: stable
summary: 从有限且可预先加载的选项中选择一个值。
package_import: "@zeron/ui/select"
registry_import: "@/components/ui/select"
source: packages/ui/src/components/select.tsx
registry: packages/ui/registry.json
related:
  - field
  - combobox
  - radio-group
  - checkbox-group
---

# Select

## Agent intent

使用 Select 从一组有限、可预先获得的选项中选择一个值。它提供键盘导航、typeahead、碰撞感知定位、表单提交和可控展开状态。

Select 是 compound component。必须保持以下基本结构：

```tsx
<Select>
  <SelectTrigger />
  <SelectContent>
    <SelectItem value="...">...</SelectItem>
  </SelectContent>
</Select>
```

不要省略 Trigger 或 Content，也不要把 SelectItem 放到 Select 之外。

## Use when

- 用户必须从有限选项中选择一个值。
- 选项标签较短，数量可以在弹出层中高效浏览。
- 表单需要原生 `name`、`required` 和提交值。
- 需要分组、图标、禁用选项或可滚动列表。

## Do not use when

- 选项很多、来自远程搜索或用户需要输入关键词过滤：使用 Combobox。
- 允许选择多个值：使用多选 Combobox 或 CheckboxGroup。
- 选项只有 2–5 个且比较成本很重要：优先 RadioGroup，让选项始终可见。
- 表达即时布尔开关：使用 Switch。
- 触发的是命令而不是选择持久值：使用 Dropdown。

## Variant and density rules

- `SelectTrigger variant="bordered"` 是默认选择，适合表单和独立控件。
- `borderless` 只用于已有明确边界的工具栏、表格或容器；不要用于孤立字段。
- 根组件的 `size` 控制 trigger 高度、padding、文字与图标尺寸。
- `itemDensity` 独立控制 popup 选项密度：`compact`、`regular`、`comfortable`。
- 默认使用 `size="md"` 与 `itemDensity="regular"`。
- 同一表单中的 Select、Input、Button 使用相同 control size；选项密度可根据内容复杂度独立调整。

## Value and option rules

- 每个 SelectItem 的 `value` 必须稳定且唯一；不要使用数组 index 或本地化显示文案作为持久 ID。
- 简单场景使用 `defaultValue`；当选择会驱动其他界面或需要与 URL/表单状态同步时，使用 `value` 与 `onValueChange`。
- 受控 `open` 必须同时处理 `onOpenChange`，否则弹出层无法正常响应用户操作。
- SelectItem 包含图标或富内容时，通过 `label` 指定 trigger 关闭后应显示的内容。
- 富内容无法直接用于键盘匹配时，通过 `textValue` 提供纯文本 typeahead 值。
- 不要使用已弃用的 `index`；组件会根据 item 顺序推导索引。

## Grouping and content

- 选项存在清晰类别时使用 SelectGroup 与 SelectLabel。
- 组之间可使用 SelectSeparator；不要为每两个选项都添加 separator。
- 选项文案应互斥且使用相同语法结构。
- 当前选中项由组件提供 checkmark 与背景反馈，不要在 item 内重复添加选中图标。
- Trigger 中的长值会截断；确保完整值能从上下文、选项列表或辅助说明中理解。

## Validation and accessibility

- 表单字段需要持久可见的 FieldLabel；placeholder 不能替代 label。
- 根组件可设置 `name`、`required` 与 `disabled`。
- 单个不可用选项设置 SelectItem 的 `disabled`，不要从列表中隐藏仍有解释价值的选项。
- `SelectTrigger error` 提供错误视觉和内联错误文案。正式表单还应确保 label 与错误说明具备可访问关系。
- 保留组件内建的键盘导航、typeahead、Escape 关闭和 collision handling，不要用自定义点击监听或 animation 重写它们。

## Composition

受控表单选择：

```tsx
import { useState } from "react";
import { Field, FieldLabel } from "@zeron/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";

function RoleSelect() {
  const [role, setRole] = useState("");

  return (
    <Field name="role">
      <FieldLabel>角色</FieldLabel>
      <Select name="role" onValueChange={setRole} required value={role}>
        <SelectTrigger placeholder="选择角色…" />
        <SelectContent>
          <SelectItem value="admin">管理员</SelectItem>
          <SelectItem value="editor">编辑者</SelectItem>
          <SelectItem value="viewer">查看者</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}
```

带分组和富标签的选择：

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@zeron/ui/select";

<Select defaultValue="system">
  <SelectTrigger placeholder="选择主题…" />
  <SelectContent>
    <SelectGroup>
      <SelectLabel>自动</SelectLabel>
      <SelectItem label="跟随系统" textValue="跟随系统" value="system">
        跟随系统主题
      </SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>固定主题</SelectLabel>
      <SelectItem value="light">浅色</SelectItem>
      <SelectItem value="dark">深色</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

## Safe customization

- 可以调整 Trigger 的布局宽度、Content 的最大宽度及 side/alignment 参数。
- 可以替换 placeholder、图标、group 和 item 内容。
- 不要移除 Portal、Positioner、选中反馈、focus ring 或 open/close 生命周期。
- 不要在业务侧复制 hover/checkmark 动画；它们属于组件行为。
- 若需要搜索、多选、异步加载或创建新选项，应切换到 Combobox，而不是持续扩展 Select。

## Verification checklist

- [ ] Select 用于单选且选项规模有限。
- [ ] 所有 value 稳定且唯一。
- [ ] compound component 层级完整。
- [ ] 富内容 item 提供了合适的 `label`/`textValue`。
- [ ] 正式表单具有可见标签和错误说明。
- [ ] controlled value/open 都有对应 change handler。
- [ ] Trigger 与相邻 controls 尺寸一致。

## API anchors

Agent 优先关注：

- Select：`value`、`defaultValue`、`onValueChange`、`open`、`onOpenChange`、`disabled`、`name`、`required`、`size`、`itemDensity`。
- SelectTrigger：`variant`、`icon`、`prefix`、`placeholder`、`error`。
- SelectItem：`value`、`label`、`textValue`、`icon`、`disabled`。
- SelectContent：`side`、`align`、`sideOffset`、`alignOffset`。

完整类型以 `source` 指向的实现为准。
