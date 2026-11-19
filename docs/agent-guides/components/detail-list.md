---
schema_version: 1
name: detail-list
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 带精细边框与分组分割线的键值详情列表，用于紧凑展示资源元数据、配置项与实体属性。
package_import: "@zeron/ui/detail-list"
registry_import: "@/components/ui/detail-list"
source: packages/ui/src/components/detail-list.tsx
registry: packages/ui/registry.json
related:
  - info-item
  - card
  - table
  - badge
---

# DetailList

## 视觉角色与空间配比（Design & Spatial Rules）

- **结构化呈现单对象的“名片式”元数据**：在资源详情页、部署报告、交易账单或侧边检查器（Inspector）中，用 `DetailList` 替代杂乱的多列小卡片或手写的 `flex justify-between` 文本行。
- **分组与行数节奏**：每组 `DetailList` 建议包含 `3~7` 行相关属性（如“基础信息”、“网络与端点”、“计费配额”）；属性超过 8 项时使用内部标题或分割线拆组，避免形成冗长的视觉墙。
- **标签与值的视觉对比**：左侧 Label 保持精炼名词（对齐且颜色偏柔和 `text-fg-muted`），右侧 Value 突出展示核心数据（ID/哈希值搭配等宽字体或 `InputCopy`，状态搭配 `Badge`）。

## Use when

- 展示单一实体（如模型、集群、订单、Agent 会话）的只读或半交互键值属性清单。

## Do not use when

- 对比多条同类记录的二维数据集：使用 `Table` 或 `DataTable`。
- 每行需要携带大型前导头像/图标、主副双行说明及右侧操作按钮的丰富列表：使用 `InfoItem`。

## 公共契约与安全定制

- 使用公开的 `DetailList` 及其分组/行子组件组合，保留组件内置的 `0.5px` 语义分割线与内边距契约。
- 不要在 `DetailList` 外层再套一层多余的带边框 `Card`。

## 工作区集成示例

```tsx
import { DetailList, DetailListItem, DetailListLabel, DetailListValue } from "@zeron/ui/detail-list";

export function ResourceDetails({ region }: { region: string }) {
  return <DetailList>
    <DetailListItem><DetailListLabel>区域</DetailListLabel><DetailListValue>{region}</DetailListValue></DetailListItem>
  </DetailList>;
}
```
