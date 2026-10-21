---
schema_version: 1
name: model-selector
kind: component
status: stable
summary: 受控模型选择器，包含可选相对评分、扩展思考和联网搜索设置。
package_import: "@zeron/ui/model-selector"
registry_import: "@/components/ui/model-selector"
source: packages/ui/src/components/model-selector.tsx
types: packages/ui/src/components/model-selector/types.ts
registry: packages/ui/registry.json
typecheck_examples: true
related: [input-message, popover, command, switch, avatar, model-selector-01]
---

# ModelSelector

安装 `npx zeron-ui add model-selector`。模型、图标和可用状态由宿主提供；组件不依赖演示模型或品牌图标库。

```tsx
"use client";
import { useState } from "react";
import { ModelSelector, modelSelectorZhLabels, type ModelSelectorModel, type ModelSelectorValue } from "@zeron/ui/model-selector";

export function ModelChoice({ models }: { models: readonly ModelSelectorModel[] }) {
  const [value, setValue] = useState<ModelSelectorValue>({ modelId: "auto", extendedThinking: false, webSearch: false });
  return <ModelSelector models={models} value={value} onValueChange={setValue} labels={modelSelectorZhLabels} />;
}
```

Registry 消费项目改用 `@/components/ui/model-selector`。放入 InputMessage.leftSlot 即可组合输入框；InputMessage 单独安装。

- models 提供唯一非空 id、name、description、装饰性 icon，可选 disabled 和 ratings（speed/quality/cost，1–5 档）。费用评分越高代表越昂贵，未提供评分显示动态变化。
- value 包含 modelId、extendedThinking、webSearch；onValueChange 返回完整新对象，选择模型保留两项设置，再次选择当前模型只关闭面板。宿主负责能力校验、网络请求和持久化。
- open/onOpenChange 或 defaultOpen 控制弹层。disabled 禁用整个控件并隐藏面板；不可用模型跳过键盘导航。空列表显示空状态，无匹配模型显示选择提示，不自动改写 value。
- 键盘高亮独立于已确认选择；宿主改变 modelId 或重开弹层时同步，选项移除或禁用后回退可用项，保留输入焦点。aria-current 表示已确认选择，aria-describedby 提供说明与评分。
- labels 支持局部覆盖，导出 modelSelectorEnLabels/modelSelectorZhLabels。locale、currency 和模型的 firstTokenSeconds/costPerMillionTokens 保留兼容，当前精简列表不展示金额或延迟。
- side/align 控制弹层方位，className 仅控制触发按钮外部布局；窄容器将评分放到说明下方，较宽时并列展示。内部样式复用 Popover、Command、Avatar、Switch 和 Button。
- model-selector-01 继续提供原有组件、类型、文案和 createModelSelectorDemoModels/modelSelectorDemoValue；其组件导出转向同一 UI 实现。演示工厂和品牌图标依赖保留在 block，不进入基础组件。
