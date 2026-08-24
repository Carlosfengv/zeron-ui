---
schema_version: 1
name: button
kind: component
status: stable
summary: 触发即时操作或推动用户完成当前任务。
package_import: "@zeron/ui/button"
registry_import: "@/components/ui/button"
source: packages/ui/src/components/button.tsx
registry: packages/ui/registry.json
related:
  - button-group
  - dropdown
  - field
---

# Button

## Agent intent

使用 Button 表达用户可以立即触发的操作。先判断操作的语义和优先级，再选择 `variant`；不要因为某种颜色更醒目而选择变体。

生成或修改界面时，必须遵守以下规则：

- 每个任务区域最多只有一个高强调操作。
- `primary` 与 `neutral` 都是高强调操作，同一区域只能二选一。
- 非提交按钮位于 `<form>` 内时，显式设置 `type="button"`。
- 仅图标按钮必须提供可访问名称，例如 `aria-label`。
- 异步操作进行中使用 `loading`，不要另行叠加自制 spinner。

## Use when

- 提交、保存、创建、确认、继续或删除等即时操作。
- 打开 Dialog、Popover、Dropdown 等临时界面。
- 工具栏和上下文区域中的图标操作。
- 需要把链接渲染成按钮视觉时，可使用 `asChild` 包裹单个链接元素。

## Do not use when

- 用户只是跳转到普通内容页面：优先使用语义正确的链接；只有确实需要按钮视觉时才使用 `asChild`。
- 用户需要在多个值之间切换：使用 Select、Tabs、Switch 或 RadioGroup。
- 操作是一组紧密连接的分段动作或 split action：使用 ButtonGroup 组合 Button。
- 整张卡片或整行都是点击目标：让容器承担交互语义，不要在其上覆盖一个不可见 Button。

## Variant selection

| Variant | 强调层级 | 使用场景 | 不要用于 |
| --- | --- | --- | --- |
| `primary` | 高 | 当前任务的主要操作，并且适合体现品牌色，例如创建、继续、发布 | 与另一个 `primary` 或 `neutral` 并列竞争 |
| `neutral` | 高 | 主要操作需要保持中性，例如保存、确认、登录 | 仅为了“更高级”而替代 `primary`；与 `primary` 并列 |
| `destructive` | 高风险 | 不可逆或高风险操作，例如删除账户、移除成员 | 普通错误、取消或容易撤销的变更 |
| `secondary` | 中 | 支持主要任务的选项，例如保存草稿、预览、稍后处理 | 页面唯一或最重要的行动按钮 |
| `tertiary` | 低 | 低优先级但仍需要清晰边界的独立操作 | 在操作密集的工具栏里大量重复 |
| `ghost` | 低 | 工具栏、图标和上下文操作，周边结构已经表明其可点击 | 缺少上下文的唯一行动按钮 |

危险操作只有在“处理危险操作”本身就是当前任务时，才让 `destructive` 成为区域中的高强调操作。

## Size and icon rules

- 默认使用 `size="md"`。
- 同一操作组内保持相同尺寸；与 Input、Select 并排时使用相同 control size。
- `xs`、`sm` 适合高密度表格和工具栏；`lg`、`xl` 只用于更宽松或更突出的操作区域。
- 常规按钮通过 `leadingIcon` 或 `trailingIcon` 放置图标，不要手动复制组件内部间距。
- `iconOnly` 按钮的 child 应是单个图标，并提供 `aria-label`；装饰性图标添加 `aria-hidden`。
- `dashed` 主要表达尚未添加的项目或未激活的筛选器，通常与有边界的低强调变体搭配。
- `active` 只表示按钮控制的外部界面仍处于打开或按住状态，例如 Dropdown 正在显示；不要把它当作业务选中状态的通用替代。

## State behavior

- `loading` 会显示内置加载指示器并禁用按钮，同时保留原标签所占宽度。
- `disabled` 表示当前操作不可用；如果原因不明显，应在附近解释原因。
- 不要在 `loading` 时再次触发提交，也不要同时渲染另一套加载文案导致按钮宽度跳动。
- 危险操作不能只依赖红色表达风险，标签必须明确描述结果，例如“删除项目”。

## Composition

标准操作组：一个高强调操作，加若干低强调选项。

```tsx
import { Button } from "@zeron/ui/button";

<div className="flex items-center gap-2">
  <Button type="submit">创建项目</Button>
  <Button type="button" variant="secondary">保存草稿</Button>
  <Button type="button" variant="ghost">取消</Button>
</div>
```

异步与图标操作：

```tsx
import { Button } from "@zeron/ui/button";
import { useIcon } from "@zeron/icons/context";

const Refresh = useIcon("rotate-ccw");

<Button
  aria-label="刷新日志"
  disabled={!canRefresh}
  iconOnly
  loading={isRefreshing}
  onClick={refresh}
  type="button"
  variant="ghost"
>
  <Refresh aria-hidden />
</Button>
```

## Safe customization

- 可以调整布局级 `className`，例如宽度、对齐或容器内伸缩。
- 可以替换标签、图标和事件处理器。
- 不要覆盖语义颜色、focus ring、disabled opacity、loading 结构或按压反馈；这些属于组件契约。
- 不要在业务代码中重建与现有 variant 相同的颜色组合；需要新语义时先扩展设计系统。

## Verification checklist

- [ ] 一个任务区域不超过一个 `primary`/`neutral`。
- [ ] variant 与操作意图一致。
- [ ] form 内的非提交按钮具有 `type="button"`。
- [ ] icon-only 按钮具有明确的 `aria-label`。
- [ ] 异步操作使用 `loading` 并阻止重复提交。
- [ ] 与相邻 controls 的尺寸一致。

## API anchors

Agent 只需优先关注：`variant`、`size`、`loading`、`disabled`、`active`、`iconOnly`、`leadingIcon`、`trailingIcon`、`dashed`、`asChild`。完整类型以 `source` 指向的实现为准。
