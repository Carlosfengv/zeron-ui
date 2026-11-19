---
schema_version: 1
name: card
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 组织具有明确边界的同组内容，支持堆叠、行内与二维邻近悬停网格布局。
package_import: "@zeron/ui/card"
registry_import: "@/components/ui/card"
source: packages/ui/src/components/card.tsx
registry: packages/ui/registry.json
related:
  - container
  - page-layout
  - metric-card
  - detail-list
---

# Card

## 视觉角色与空间配比（Design & Spatial Rules）

- **克制使用外框（反“框套框”铁律）**：`PageContent` 已经自带 floating 表面与圆角边框。处于 `PageContent` 内的主表格（`DataTable`）或整页主列表外层**严禁**再包裹一层 `Card`。
- **优先使用无边框分割或共享外框**：多条同构记录并列时，优先使用 `<CardGroup orientation="inline">`（依靠 `0.5px` hairline 分割线呼吸）或 `<CardGroup border="outlined">`（共享单一外框），避免满屏独立描边小盒子造成视觉碎片化。
- **网格列数与舒适宽度**：使用 `<CardGroup columns={2} separated>` 或三列布局 时，在 `1280px~1440px` 标准内容区推荐单行 `2~3` 列（单卡最小舒适宽度 `280px~340px`），单行不要超过 4 列。
- **整卡点击 vs 内部按钮**：若整张卡片代表可跳转资源（传入 `href`），不要在 `CardFooter` 内再堆砌多个竞争焦点的 `CardButton`；若卡片底部有明确操作按钮，主操作限制为 1 个。

## Use when

- 展示目录画廊、模型/应用卡片网格、功能特性块或分步设置卡片。
- 需要 `CardGroup` 提供的一维或二维（`columns > 1`）邻近悬停高光（Proximity Hover）。
- 卡片包含标准化的 `CardMedia` / `CardImage`、`CardHeader`（`CardTitle` + `CardDescription`）、`CardContent` 与 `CardFooter` 组合。

## Do not use when

- 展示单一核心 KPI 数值与环比趋势：优先使用 `MetricCard`。
- 展示紧凑的键值属性详情：优先使用 `DetailList` 或 `InfoItem`。
- 需要带固定顶栏、底栏与内部独立滚动区的工作台容器：使用 `Container`。
- 作为整个页面的外层宽度或边距容器：使用 `PageLayout`。

## 公共契约与组合规范

- `CardGroup` 控制集合级布局：`orientation`（`"stacked" | "inline"`）、`columns`（列数）、`border`（`"none" | "outlined"`）与 `separated`（独立卡片间距模式）。
- 标题字重动画由 `CardTitle` 内置的零重排单节点机制管理，不要在外部覆写 `font-weight` 过渡类。
- 保持语义表面与圆角令牌（`bg-card`、`hover:bg-hover`），不要手写硬编码背景色或阴影。

## 工作区集成示例

```tsx
import { Card, CardContent, CardGroup, CardHeader, CardTitle } from "@zeron/ui/card";

export function ResourceCards({ names }: { names: string[] }) {
  return <CardGroup columns={2} separated>
    {names.map(name => <Card key={name}>
      <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
      <CardContent>已接入工作区</CardContent>
    </Card>)}
  </CardGroup>;
}
```
