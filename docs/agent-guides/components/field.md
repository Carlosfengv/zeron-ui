---
schema_version: 1
name: field
kind: component
status: stable
locale: zh-CN
summary: 组合表单控件、可访问标签、帮助信息与校验错误，业务层保有值和提交状态。
package_import: "@zeron/ui/field"
registry_import: "@/components/ui/field"
source: packages/ui/src/components/field.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [input, select, combobox, button]
---

# Field

## 使用与组合

Field 管理一个字段的语义，不是表单状态库或远程提交引擎。使用 `FieldLabel`、实际控件、`FieldDescription` 与 `FieldError`，不要把占位符当成标签。多字段布局用 `FieldGroup`；有共同语义的一组控件用 `Fieldset` 与 `FieldsetLegend`。

## 公共契约

- `Field` 接收底层 Field Root props，包括 `name`、`invalid`、`disabled`。业务字段名保持稳定，不能用翻译后的标签作 key。
- `FieldLabel`、`FieldDescription`、`FieldError` 保留底层关联和校验行为；不要自行复制错误样式或移除可访问关联。
- `FieldItem` 为选择／开关类控件提供同行组合；不是另一个独立字段 Root。
- 控件尺寸属于 Input／Select 等公开 API，Field 不通过任意高度类修改控件。
- `FieldGroup` 只负责布局；读取、dirty、保存、重试、服务端字段错误属于业务层。

## 受控字段

```tsx
"use client";
import { Field, FieldLabel, FieldDescription, FieldError } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
export function WorkspaceNameField({ value, onChange, error, canEdit }: {
  value: string; onChange: (value: string) => void;
  error?: string; canEdit: boolean;
}) {
  return <Field name="workspaceName" invalid={Boolean(error)} disabled={!canEdit}>
    <FieldLabel>工作区名称</FieldLabel>
    <Input value={value} onChange={(event) => onChange(event.target.value)} disabled={!canEdit} />
    <FieldDescription>该名称对工作区成员可见。</FieldDescription>
    {error && <FieldError>{error}</FieldError>}
  </Field>;
}
```

## 数据与状态

初次加载、正在保存和禁止编辑分别记录，不能都叫 disabled。读取刷新时保留用户未保存修改；提交失败保留字段值，将服务端错误映射到真实字段，并提供重试。全局网络错误放在表单级区域，不在每个 Field 内重复。

可见禁用不是权限控制，保存接口仍核验权限。校验成功前不能自动关闭表单；提交按钮使用 Button 的 loading，并在业务回调中避免重复提交。

## 定制与验收

可以调整字段组列数、宽度和布局间距，不覆盖标签关联、错误颜色或 focus ring。检查点击标签聚焦、键盘顺序、长帮助文案、服务端字段错误、清除／修正错误、只读权限和窄屏。示例类型由 `agents:guides:examples:check` 验证；不据此声称真实保存接口已经接通。消费者按实际 aliases 使用已安装源码。
