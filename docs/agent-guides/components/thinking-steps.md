---
schema_version: 1
name: thinking-steps
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 展示 AI 推理思维链（Chain-of-Thought）与多步执行进度的可折叠组件，内置顺序弹簧入场动画。
package_import: "@zeron/ui/thinking-steps"
registry_import: "@/components/ui/thinking-steps"
source: packages/ui/src/components/thinking-steps.tsx
registry: packages/ui/registry.json
related:
  - chat-message
  - chat-thread
  - artifact-panel
---

# ThinkingSteps

## 视觉角色与空间配比（Design & Spatial Rules）

- **“可透明、不喧宾夺主”的 AI 过程设计**：思维链是辅助用户建立信任的过程证据，**最终回复与产物才是视觉主角**。因此当 AI 正在推理时默认展开当前步骤；一旦正式回复开始流式输出，支持或引导折叠思维链为一行紧凑摘要（如“已完成 4 步深度思考 · 耗时 2.4s”）。
- **步骤颗粒度与文案规范**：每一步标题使用简明动宾短语（如“检索网关近 7 天错误日志”、“比对回退模型延迟分布”），单次推理建议展示 `2~6` 个关键里程碑步骤，不要把底层零碎 Token 拼装成几十行流水账。
- **与 `ChatThread` 的空间融合**：作为 `ChatMessage` 的前导推理块嵌入会话流，宽度与正文气泡对齐，不在外层额外包裹粗重边框。

## Use when

- 深度推理模型（Reasoning Models）或多步 Agent 执行任务时，需要向用户实时反馈思考脉络、检索来源或子任务完成状态。

## Do not use when

- 仅需展示单句极简的“正在思考…”微动画状态（无分步明细）：使用更轻量的 `ThinkingIndicator`。
- 需要用户介入做分支选择或风险审批的交互节点：可使用 `AskUserQuestions` 收集选择。

## 公共契约与安全定制

- 遵循组件公开的步骤状态 `pending`、`active`、`complete`。通过 `ThinkingSteps.open` 和 `onOpenChange` 控制展开状态；保留内置的 `springs.moderate` 展开过渡。

## 工作区集成示例

```tsx
import { ThinkingStep, ThinkingSteps, ThinkingStepsContent, ThinkingStepsHeader } from "@zeron/ui/thinking-steps";

export function SearchProgress({ complete }: { complete: boolean }) {
  return <ThinkingSteps defaultOpen>
    <ThinkingStepsHeader>任务进度</ThinkingStepsHeader>
    <ThinkingStepsContent>
      <ThinkingStep label="检索日志" status="complete" />
      <ThinkingStep label="汇总结果" status={complete ? "complete" : "active"} isLast />
    </ThinkingStepsContent>
  </ThinkingSteps>;
}
```
