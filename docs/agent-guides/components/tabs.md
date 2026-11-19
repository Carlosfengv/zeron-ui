---
schema_version: 1
name: tabs
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 在同一上下文内切换并列视图的标签页组件，内置滑动激活指示器与零重排字重过渡。
package_import: "@zeron/ui/tabs"
registry_import: "@/components/ui/tabs"
source: packages/ui/src/components/tabs.tsx
registry: packages/ui/registry.json
related:
  - nav-menu
  - stepper
  - page-layout
---

# Tabs

## 视觉角色与空间配比（Design & Spatial Rules）

- **按视觉层级选择 3 种变体（`variant`）**：
  - `underline`：适合页面级或区块主内容视图切换（如详情页的“概览 / 指标 / 审计日志”），视觉最克制。
  - `segment`：适合紧凑卡片头、图表时间粒度切换（如“24h / 7d / 30d”）或预览/代码二选一切换；选项数量建议 `2~4` 个。
  - `pill`：适合筛选胶囊或次级分类导航。
- **数量与宽度控制**：单组 `TabsList` 建议控制在 `2~6` 个标签项内；标签文案保持简短名词（2～6 个汉字），不要把长句塞进 Tab。
- **避免多级 Tabs 堆叠**：如果页面顶部已有 `PageSubnav` 或主 `Tabs`，子卡片内部优先使用 `Select` 或紧凑的 `segment` 切换，不要连续垂直堆叠两排 `underline` 标签栏。

## Use when

- 用户在同一任务上下文中切换不同维度的同级视图，且无需改变整体页面外壳。

## Do not use when

- 存在先后顺序与完成校验的分步流程：使用 `Stepper`。
- 跨独立路由的全局主导航或侧栏导航：使用 `TopNav`、`Sidebar` 或 `NavMenu`。
- 在表单中选择一个提交字段值：使用 `RadioGroup` 或 `Select`。

## 公共契约与安全定制

- 使用 `Tabs > TabsList > TabItem` 与 `TabPanel` 组合；为 `TabItem` 传入 `label` 属性以启用内置的零重排字重动画与滑动背景弹簧（`springs.moderate`）。
- 不要手动在 `TabItem` 上覆写 `font-bold` 或背景色类，以免破坏内置的共享指示器动画与无障碍 `tablist` 键盘漫游。

## 工作区集成示例

```tsx
import type { ReactNode } from "react";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";

export function DetailTabs({ summary, history }: { summary: ReactNode; history: ReactNode }) {
  return <Tabs defaultValue="summary" variant="underline">
    <TabsList aria-label="资源详情"><TabItem value="summary" label="概览" /><TabItem value="history" label="历史" /></TabsList>
    <TabPanel value="summary">{summary}</TabPanel>
    <TabPanel value="history">{history}</TabPanel>
  </Tabs>;
}
```
