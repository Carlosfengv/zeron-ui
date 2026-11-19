---
schema_version: 1
name: ask-user-questions
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 支持单选、多选、自由补充与跳过的分步追问卡片，用于 Agent 人机协同（Human-in-the-loop）需求澄清。
package_import: "@zeron/ui/ask-user-questions"
registry_import: "@/components/ui/ask-user-questions"
source: packages/ui/src/components/ask-user-questions.tsx
registry: packages/ui/registry.json
related:
  - chat-thread
  - radio-group
  - checkbox-group
---

# AskUserQuestions

## 视觉角色与空间配比（Design & Spatial Rules）

- **把开放式打字变成低门槛点选**：当 AI 需要用户明确业务偏好（如“目标框架”、“数据范围”、“视觉风格”）时，嵌入 `AskUserQuestions` 卡片，让用户点选 2～3 下即可完成澄清，大幅降低输入阻力。
- **问题数量与选项密度**：单次追问流程建议控制在 `1~4` 个步骤内；每步提供 `2~5` 个结构化选项（把推荐项放第一位），并开启可选的“其他（自由输入）”兜底。
- **零重排字重与邻近悬停**：选项行已内置 `450 → 550` 零重排字重过渡与邻近悬停背景，不要在外部包裹多余的 `Card` 边框或修改选项行内边距。

## Use when

- Agent 执行复杂任务前需要向用户收集结构化上下文、确认参数或澄清歧义。

## Do not use when

- 展示带明确风险等级、后果说明与分支拓扑的审批决策：应单独呈现审批条件、影响与确认操作。
- 传统设置页面中的静态表单字段：使用 `Field`、`RadioGroup` 或 `CheckboxGroup`。

## 公共契约与安全定制

- 遵循组件的问题数组 schema（支持单选/多选标志、选项列表与完成回调），在用户完成或跳过后将卡片收敛为已选摘要态，保持会话流整洁。

## 工作区集成示例

```tsx
import { AskUserQuestions, type AskUserQuestionsProps } from "@zeron/ui/ask-user-questions";

export function ChooseFramework({ onComplete }: Pick<AskUserQuestionsProps, "onComplete">) {
  return <AskUserQuestions onComplete={onComplete} questions={[{
    id: "framework", title: "项目使用哪个框架？", allowOther: true,
    options: [{ id: "next", title: "Next.js" }, { id: "vite", title: "Vite" }],
  }]} />;
}
```
