---
schema_version: 1
name: input
kind: component
status: stable
summary: 收集单行文本、数字、日期、文件等原生输入值。
package_import: "@zeron/ui/input"
registry_import: "@/components/ui/input"
source: packages/ui/src/components/input.tsx
registry: packages/ui/registry.json
related:
  - field
  - input-group
  - textarea
  - select
  - combobox
---

# Input

## Agent intent

使用 Input 收集单个原生 HTML input 值。它只负责输入控件表面；标签、说明和校验消息应由 Field 组合提供。

生成表单时，必须遵守以下规则：

- 可见标签使用 FieldLabel，不要用 placeholder 代替标签。
- 校验失败时同时提供错误语义和可见错误消息。
- 需要前后缀、图标、单位、复制或内嵌操作时，使用 InputGroup，不要把元素绝对定位到 Input 上。
- 与同一表单中的 Button、Select 使用一致的 control size。

## Use when

- 单行文本、邮箱、密码、数字、URL、搜索词、日期或其他原生 input 类型。
- 文件选择，可使用 `type="file"` 和 `accept`。
- 需要标准 focus、disabled、read-only 与 validation 状态的输入控件。

## Do not use when

- 多行内容：使用 Textarea。
- 从有限选项中选择一个值：使用 Select；选项很多且需要搜索时使用 Combobox。
- 多选、布尔开关或离散选择：使用 CheckboxGroup、Switch 或 RadioGroup。
- 输入面包含单位、图标、按钮或 addon：使用 InputGroup。
- 需要结构化筛选表达式：使用 FilterQueryInput。

## Variant selection

| Variant | 使用场景 | 注意事项 |
| --- | --- | --- |
| `outline` | 默认表单、独立输入框、需要清晰边界的页面 | 默认选择 |
| `secondary` | 输入框位于已有边界的区域中，需要较弱但仍可辨认的填充表面 | 避免在大面积相同填充背景上失去边界 |
| `ghost` | 高密度工具栏、表格内或已有强容器边界的场景 | 不要用于缺少上下文的独立表单字段 |

## Size rules

- 默认使用 `size="md"`。
- 支持 `xs`、`sm`、`md`、`lg`、`xl`。
- `xs`、`sm` 适合高密度工具栏或表格；普通表单使用 `md`。
- `lg`、`xl` 适合更宽松或触控优先的界面，不要只为了吸引注意而放大。
- 同一 FieldGroup 内通常保持同一尺寸。

## Validation and state behavior

- `disabled` 表示不可交互且通常不会参与提交；`readOnly` 表示值可查看和选择，但不可修改。不要混用两者。
- 校验失败时优先组合 `Field invalid`、`Input aria-invalid` 与 `FieldError`。
- 错误消息应说明如何修复，不要只写“输入错误”。
- 保留浏览器的输入语义，正确设置 `type`、`name`、`autoComplete`、`required`、`min`、`max`、`inputMode` 等原生属性。
- 对受控 Input 提供 `value` 与 `onChange`；简单表单可使用 `defaultValue`。不要在受控和非受控模式之间切换。

## Composition

带说明与校验的标准字段：

```tsx
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";

<Field name="endpoint" invalid={Boolean(error)}>
  <FieldLabel>API Endpoint</FieldLabel>
  <Input
    aria-invalid={Boolean(error)}
    autoComplete="url"
    name="endpoint"
    placeholder="https://api.example.com"
    type="url"
  />
  <FieldDescription>请输入 HTTPS 地址。</FieldDescription>
  {error ? <FieldError>{error}</FieldError> : null}
</Field>
```

文件输入：

```tsx
import { Field, FieldDescription, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";

<Field name="avatar">
  <FieldLabel>头像</FieldLabel>
  <Input accept="image/png,image/jpeg" name="avatar" type="file" />
  <FieldDescription>PNG 或 JPEG，最大 5 MB。</FieldDescription>
</Field>
```

## Content rules

- Label 使用名词或明确的问题，例如“工作区名称”。
- Placeholder 只提供格式示例或短提示，例如 `you@example.com`，不重复标签。
- 密码、验证码等敏感字段应设置合适的 `autoComplete`，不要默认关闭自动填充。
- 数字输入先确认业务是否允许滚轮、负数、小数和本地化格式；复杂数值编辑可能需要专用组件。

## Safe customization

- 可以通过 `className` 调整布局宽度，但不要移除 focus、invalid、disabled 和 placeholder 的语义样式。
- 不要通过固定高度或自定义 padding 伪造新的 size；使用已有 `size`。
- 不要在 Input 内手工添加图标或 action；改用 InputGroup。

## Verification checklist

- [ ] 有持久可见的标签。
- [ ] 使用了正确的原生 `type` 和表单属性。
- [ ] placeholder 没有替代 label。
- [ ] invalid 状态有可见、可理解的错误消息。
- [ ] `disabled` 与 `readOnly` 的语义正确。
- [ ] 与相邻 Button、Select 的尺寸一致。
- [ ] 带 addon 或 action 的场景改用 InputGroup。

## API anchors

Agent 只需优先关注：`variant`、`size` 和原生 input props。完整类型以 `source` 指向的实现为准。
