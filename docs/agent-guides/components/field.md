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
- 标准纵向标签与控件使用 `Field` + `FieldLabel`，由 Field 的纵向 Flex 与默认 `gap-1.5`（6px）管理间距。原生 `label` 默认为行内元素，上下 margin 不会撑开行间距离；不要用 `label` + `space-y-*` 拼出同款字段，也不要给 Input 增加 margin 来补偿。
- `FieldGroup` 只负责布局；读取、dirty、保存、重试、服务端字段错误属于业务层。

## 多控件组合

一个 `Field` 对应一个需要标签关联的逻辑控件，不能把它当成整行或整组控件的布局容器。即使数字输入框和 Slider 编辑同一个业务值，它们也是两个可聚焦控件；放进同一个 Field 可能继承同一个自动 ID，造成重复 ID 和标签目标歧义。

- 多个独立字段分别使用 Field，外层用 `FieldGroup` 排列；具有共同语义的组合用 `Fieldset` / `FieldsetLegend` 命名，不使用一个 FieldLabel 代替整组标题。
- Slider 等复合控件按自己的公开标签 API 组合，放在另一个控件的 Field 外；业务层可以同步它们的值。InputGroup 的边框、图标和附加操作仍可与其中的一个输入框属于同一个 Field，无需为每个装饰或按钮另建 Field。
- Field 的 gap 只作用于直接布局子项。标签和控件若藏在同一个内部 div 中，外层 gap 不会为它们提供间距。标准纵向字段让 FieldLabel 和控件（或 InputGroup）占据两个独立布局子项，不叠加 `space-y-*` 或 Input margin 补偿。
- 自动关联仅适用于支持 Field 的控件。原生 select 或通过按钮触发的复合控件，需要按公开 API 显式连接 `FieldLabel.htmlFor` 与目标 `id`；重复实例用 `useId` 生成 ID。
- 验收时检查同页多个实例及展开的弹层：控件 ID 唯一，每个可聚焦控件有明确名称，点击标签聚焦预期目标；验证联动、禁用和错误状态。不要通过删除可访问标签来消除重复 ID。

```tsx
"use client";
import { Field, FieldLabel, Fieldset, FieldsetLegend } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { Slider } from "@zeron/ui/slider";

export function UsageAdjustment({ value, onChange }: {
  value: number; onChange: (value: number) => void;
}) {
  return <Fieldset>
    <FieldsetLegend>用量</FieldsetLegend>
    <Field>
      <FieldLabel>精确值</FieldLabel>
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
    <Slider label="用量滑块" value={value} min={0} max={100} onChange={(next) => {
      if (typeof next === "number") onChange(next);
    }} />
  </Fieldset>;
}
```

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

在实际页面或弹窗中检查标签到控件的间距和控件高度，不能仅凭 `space-y-*` 的计算值或静态测试通过判断布局正常。保留控件公开 size；当前 Input 默认 `md` 为 32px。无可见标签的搜索／工具栏控件仍需提供可访问名称，不强制套用纵向 Field 排列。
