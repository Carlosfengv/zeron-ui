---
schema_version: 1
name: avatar
kind: component
status: stable
summary: 使用圆形或圆角矩形图片、回退内容、状态标记和用户详情表示人物、智能体或账号。
package_import: "@zeron/ui/avatar"
registry_import: "@/components/ui/avatar"
source: packages/ui/src/components/avatar.tsx
registry: packages/ui/registry.json
related:
  - badge
  - info-item
  - sidebar-identity-row
---

# Avatar

## Agent intent

使用 Avatar 表示人物、智能体、团队或账号身份。始终同时提供 `AvatarImage` 和 `AvatarFallback`，让图片加载失败或尚未完成时仍有可识别内容。

生成或修改界面时，必须遵守以下规则：

- 默认使用 `size="default"`，即 32px。只有高密度界面使用 `sm`，明确需要更高身份强调时才使用 `lg`。
- 默认使用 `shape="circle"`；产品表面需要较柔和的方形头像、智能体图标或品牌图标时使用 `shape="rounded"`（`rounded-xl`）。
- `AvatarWithDetails` 使用正常正文与辅助文字密度，不会自动放大内部 Avatar；需要其他头像尺寸时直接设置 Avatar 的 `size`。
- 图片旁边已经显示同一个姓名时，`AvatarImage` 使用 `alt=""`，避免读屏重复播报；没有相邻姓名时提供可识别人物或账号的 alt。
- 文本徽章放入 `AvatarWithDetails.badge` 并使用 Badge；`AvatarBadge` 只用于头像右下角的状态点或小图标。
- 状态不能只靠颜色传达。`AvatarBadge` 必须包含视觉隐藏文案，或在相邻内容中提供同等状态说明。
- 头像组需要可理解的组名称和溢出计数名称；优先使用 `role="group"` 与 `aria-label`。

## Use when

- 在账号菜单、成员列表、评论、聊天、分配器或协作者区域中显示身份。
- 图片可能缺失或加载失败，需要姓名首字母或图标作为稳定回退。
- 需要在头像角落表达在线、忙碌、离开或已验证等简短状态。
- 需要将少量协作者头像重叠展示，并将其余人数汇总为 `AvatarGroupCount`。
- 需要标准的“头像 + 姓名 + 描述 + 可选 Badge”身份摘要时使用 `AvatarWithDetails`。

## Do not use when

- 需要完整的列表行、尾部数值或操作区：使用 InfoItem 或业务列表组件组合 Avatar。
- 需要可点击的账号切换、菜单或导航行为：Avatar 只负责视觉身份，交互语义应由 Button、链接或菜单触发器承担。
- 需要上传、裁剪或编辑头像：使用文件输入与专用编辑流程，Avatar 只展示结果。
- 需要表达普通标签或订阅等级但没有用户详情：直接使用 Badge，不要把文本塞进 `AvatarBadge`。
- 需要展示大量成员或可搜索选择：使用成员列表、Combobox 或 MemberTree，不要无限扩展 AvatarGroup。

## Composition map

| 场景 | 组合 | 规则 |
| --- | --- | --- |
| 单个头像 | `Avatar` + `AvatarImage` + `AvatarFallback` | Image 和 Fallback 都保留 |
| 状态头像 | 单个头像组合 + `AvatarBadge` | Badge 位于 Avatar 内部，并提供状态文本 |
| 头像组 | `AvatarGroup` + 多个 `Avatar` + 可选 `AvatarGroupCount` | GroupCount 是 AvatarGroup 的直接子项 |
| 用户详情 | `AvatarWithDetails` + `avatar` / `name` / `description` / `badge` | `avatar` 通常传完整 Avatar，badge 通常传 Badge |

## Size and density

| Avatar size | 尺寸 | 使用场景 |
| --- | --- | --- |
| `sm` | 24px | 高密度表格、紧凑工具栏、次要成员标识 |
| `default` | 32px | 默认账号、列表、评论和详情组合 |
| `lg` | 40px | 账号菜单头部、成员卡片等明确强调身份的区域 |

不要通过 `className="size-*"` 创建未定义的头像尺寸。尺寸会同时影响回退文字、角标和头像组计数；应使用公开的 `size` API 保持组合一致。

`AvatarWithDetails` 默认搭配 32px Avatar、`text-body` 姓名和 `text-label` 描述。它接受任意 ReactNode 作为 name、description 和 badge，但这些插槽应保持短小；长内容会截断。

## Shape

| Avatar shape | 圆角 | 使用场景 |
| --- | --- | --- |
| `circle` | `rounded-full` | 默认人物头像与成员头像 |
| `rounded` | `rounded-xl` | 智能体、品牌账号或需要圆角矩形轮廓的头像 |

`shape` 会同时作用于 Avatar 根节点、图片、Fallback 和边框，不要分别覆盖子组件圆角。`AvatarBadge` 始终保持圆形状态点。AvatarGroup 中的 Avatar 应使用一致的 `shape`；`AvatarGroupCount` 保持圆形计数标记。

## Image and fallback rules

- `AvatarImage.src` 使用稳定的图片地址，并为非装饰图片提供准确 alt。
- 回退内容优先使用 1–2 个可识别字符，例如姓名首字母；不要把完整姓名塞入圆形头像。
- 使用 `delay` 延迟 Fallback，只用于避免快速加载图片时发生闪烁；不要以此替代真实 loading 状态。
- Image 与 Fallback 由组件内部叠放并处理加载状态；不要覆盖它们的定位或加载/错误可见性样式。
- 图片附近已有同名文本时使用空 alt：`<AvatarImage alt="" />`。
- 没有相邻身份文本时使用可识别 alt：`<AvatarImage alt="Chen Ning" />`。
- 不要仅依赖远程图片；任何图片头像都必须保留 Fallback。

## Status and badge semantics

`AvatarBadge` 是角落状态标记，不是文本 Badge：

```tsx
<Avatar>
  <AvatarImage src="/chen.jpg" alt="Chen Ning" />
  <AvatarFallback>CN</AvatarFallback>
  <AvatarBadge className="bg-success-border">
    <span className="sr-only">在线</span>
  </AvatarBadge>
</Avatar>
```

订阅等级、角色或分类标签使用 Badge，并通过 `AvatarWithDetails.badge` 传入：

```tsx
import { Badge } from "@zeron/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarWithDetails,
} from "@zeron/ui/avatar";

<AvatarWithDetails
  avatar={
    <Avatar>
      <AvatarImage src="/alex.jpg" alt="" />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  }
  name="Alex Johnson"
  description="Founder & CEO"
  badge={<Badge size="sm">Pro</Badge>}
/>
```

如果 Badge 表达动态业务状态，按 Badge 的状态语义选择 `status`；不要为了匹配头像颜色而随意使用危险或成功状态。

## Avatar groups

```tsx
<AvatarGroup role="group" aria-label="项目成员">
  <Avatar>
    <AvatarImage src="/chen.jpg" alt="Chen Ning" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/alex.jpg" alt="Alex Johnson" />
    <AvatarFallback>AJ</AvatarFallback>
  </Avatar>
  <AvatarGroupCount aria-label="另有 3 位成员">+3</AvatarGroupCount>
</AvatarGroup>
```

- Group 中所有 Avatar 使用同一 `size` 和 `shape`。
- `AvatarGroupCount` 会根据组内 Avatar 的 data-size 调整尺寸；不要手工修改其宽高。
- 计数只汇总没有显示的成员，且必须有可访问名称。
- 当成员身份必须逐一查看或操作时，不要使用重叠头像组，改用明确列表。

## Safe customization

- 可以通过 Avatar 的 `size`、`shape`、图片 src/alt、Fallback 内容及组合组件的 `className` 调整公开能力。
- 可以给 `AvatarWithDetails` 的 name、description 和 badge 传入链接或 Badge，但外层点击行为必须保持明确，避免嵌套互动控件。
- 可以使用语义背景 token 改变 AvatarBadge 状态颜色；头像圆角使用公开的 `shape` API，不要覆盖裁剪、边框或状态角标定位。
- 不要复制图片加载、回退延迟、组尺寸同步或文本截断逻辑到业务组件。
- 不要在页面中重新创建另一套 AvatarWithDetails；业务需要更多尾部操作时组合 InfoItem。

## Verification checklist

- [ ] 每个 Avatar 同时包含 Image 和 Fallback。
- [ ] Avatar 尺寸来自 `sm`、`default` 或 `lg`，默认场景没有任意尺寸覆盖。
- [ ] Avatar 形态来自 `circle` 或 `rounded`，同一 AvatarGroup 内保持一致。
- [ ] 图片 alt 不会与紧邻姓名重复播报。
- [ ] AvatarBadge 的状态不只靠颜色表达。
- [ ] 文本标签使用 Badge，而不是 AvatarBadge。
- [ ] AvatarGroup 中尺寸一致，计数准确且有可访问名称。
- [ ] AvatarWithDetails 的姓名、描述和 Badge 在窄容器及长文本下不横向溢出。
- [ ] Avatar 本身未承担按钮或链接交互语义。

## API anchors

Agent 优先关注：

- Avatar：`shape`、`size`、`render` 与底层 Root 属性。
- AvatarImage：`src`、`alt`、`onLoadingStatusChange`。
- AvatarFallback：`delay`。
- AvatarBadge：原生 span 属性和状态可访问文案。
- AvatarGroup / AvatarGroupCount：原生 div 属性、组名称和计数名称。
- AvatarWithDetails：`avatar`、`name`、`description`、`badge`、`className`。

完整类型以 `source` 指向的实现为准。
