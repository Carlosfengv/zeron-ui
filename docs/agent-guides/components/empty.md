---
schema_version: 1
name: empty
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 面向页面、区块与行内数据容器的可组合空状态与首次引导组件，支持主题自适应插画与密度分级。
package_import: "@zeron/ui/empty"
registry_import: "@/components/ui/empty"
source: packages/ui/src/components/empty.tsx
registry: packages/ui/registry.json
related:
  - data-table
  - card
  - skeleton
  - alert
---

# Empty

## 视觉角色与空间配比（Design & Spatial Rules）

- **按容器尺度选择密度（`density` 与 `scope`）**：
  - 整页或主列表首次无数据：使用默认标准密度，搭配主题感知插画（`EmptyIllustration`）、明确的原因说明与唯一的引导创建按钮（如“创建第一个项目”）。
  - 局部卡片、侧栏列表或筛选无匹配：使用 `density="compact"` 与 `scope="section"`，避免在狭小区域里塞入过大插画导致画面失衡。
- **区分 3 种“空”的设计语义（`reason`）**：
  - **首次空数据（`first-use`）**：重在鼓励与引导下一步核心动作。
  - **搜索无结果（`no-results`）** / **筛选无匹配（`no-filter-results`）**：重在提供一键“清空搜索”或“重置筛选条件”的恢复按钮，不要让用户手动逐个删筛选器。
- **不要在 loading 或 error 时误用 Empty**：数据尚未返回时使用 `Skeleton`；请求失败且无缓存快照时使用 `Alert`。

## Use when

- `DataTable`、卡片画廊、日志流、文件管理器或搜索结果确认返回 0 条记录时。

## Do not use when

- 接口仍在请求中（使用 `Skeleton`）或发生服务端异常（使用 `Alert`）。
- 禁止手写 `<div className="border-dashed p-8 text-center">暂无数据</div>` 替代 `Empty` 原语。

## 公共契约与安全定制

- 标准结构为 `Empty > EmptyMedia (EmptyIllustration) + EmptyHeader (EmptyTitle + EmptyDescription) + EmptyActions`。
- 根据场景选用内置的语义插画变体（如 `"search"`、`"filter"`、`"resources"`），插画会自动适配浅色与深色主题令牌。

## 工作区集成示例

```tsx
import { Button } from "@zeron/ui/button";
import { Empty, EmptyActions, EmptyHeader, EmptyIllustration, EmptyMedia, EmptyTitle } from "@zeron/ui/empty";

export function NoMatches({ reset }: { reset: () => void }) {
  return <Empty reason="no-results" scope="section" density="compact">
    <EmptyMedia variant="illustration"><EmptyIllustration variant="search" /></EmptyMedia>
    <EmptyHeader><EmptyTitle>没有匹配的资源</EmptyTitle></EmptyHeader>
    <EmptyActions><Button type="button" variant="secondary" onClick={reset}>清空搜索</Button></EmptyActions>
  </Empty>;
}
```
