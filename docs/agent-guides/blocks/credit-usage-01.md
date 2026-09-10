---
schema_version: 1
name: credit-usage-01
kind: block
status: stable
summary: 展示额度周期、模型归因、预计耗尽时间和套餐控制。
registry_import: "@/components/blocks/credit-usage-01"
source: packages/blocks/src/application/credit-usage-01/credit-usage.tsx
types: packages/blocks/src/application/credit-usage-01/credit-usage-types.ts
registry: packages/blocks/registry.json
related:
  - card
  - tabs
  - switch
  - badge
---

# Credit Usage 01

## Agent intent

在账单、套餐或个人设置界面中使用此 Block，集中展示当前额度消耗、按模型归因、预计耗尽时间、自动降级策略和套餐操作。它是可嵌入的业务卡片，不创建 AppShell、Sidebar 或页面路由。

## Minimal integration

```tsx
import { useState } from "react";
import {
  CreditUsage,
  creditUsageDemoData,
  type CreditUsageCycle,
} from "@/components/blocks/credit-usage-01";

function BillingSummary() {
  const [cycle, setCycle] = useState<CreditUsageCycle>("current");
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);

  return (
    <CreditUsage
      actions={{
        onAutoSwitchChange: setAutoSwitchEnabled,
        onCycleChange: setCycle,
        onSetLimit: () => openLimitDialog(),
        onUpgrade: () => router.push("/billing/upgrade"),
      }}
      autoSwitchEnabled={autoSwitchEnabled}
      cycle={cycle}
      data={creditUsageDemoData}
    />
  );
}
```

## Data contract

- `totalCredits` 是套餐周期总额度；Block 会将负数或非有限额度归零，再对模型用量求和。总额度为 0 但存在正用量时按 100% 消耗展示，避免百分比与用量条矛盾。
- `currentCycle` 必填，`previousCycle` 可选。缺少上一周期时，对应 Tab 会禁用。
- `projection` 是服务端或领域层给出的预测结果；Block 不自行预测耗尽日期。
- `autoSwitch` 决定是否显示自动切换区域；目标模型、阈值和说明都由业务数据提供。
- 模型 `color` 使用 Badge 的语义颜色集合，避免在 Block 内维护第二套颜色常量。
- 使用 `provider` 选择内置的 OpenAI、Claude 或 Gemini 品牌标识；私有模型通过 `logo` 传入真实的产品 Logo，未提供时使用通用模型图标。
- 日期作为已格式化文本传入；数字与百分比根据 `locale` 格式化。
- 使用 `formatters.usageSummary`、`formatters.progressValueText` 和 `formatters.autoSwitchTitle` 覆盖完整句子，避免本地化时受英文词序限制。

## Interaction ownership

- `cycle` 和 `autoSwitchEnabled` 都可受控；省略时分别使用 `defaultCycle` 与 `defaultAutoSwitchEnabled`。
- 提供 `onSetLimit` 或 `onUpgrade` 时才显示对应按钮。不要传空函数制造无效操作。
- 用 `operationState.pending` 禁用正在提交的操作，用 `operationState.error` 显示非破坏性错误提示。
- 宿主负责打开 Dialog、跳转套餐页、请求数据和持久化 Switch 变更。

## Accessibility and layout

用量条暴露 `progressbar` 语义和数值文本；颜色同时由下方模型名称与数值解释，不作为唯一信息来源。Block 以 32px 默认控件高度与 28px 用量条组织密度，最大宽度为 520px；模型列表始终保持单列，在窄屏下会让头部与操作区换行。不要用后代选择器覆盖内部组件状态。
