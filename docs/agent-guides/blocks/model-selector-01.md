---
schema_version: 1
name: model-selector-01
kind: block
status: stable
locale: zh-CN
summary: 模型选择弹层，包含速度、质量和费用评分、扩展思考与联网搜索。
package_import: "@zeron/blocks/model-selector-01"
registry_import: "@/components/blocks/model-selector-01"
source: packages/blocks/src/application/model-selector-01/model-selector.tsx
types: packages/blocks/src/application/model-selector-01/model-selector-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [model-selector, popover, command, switch, input-message, avatar, button]
---

# Model Selector

通用组件现由 `@zeron/ui/model-selector` 提供，独立安装使用 `npx zeron-ui add model-selector`。本 block 保留原有组件、类型和文案导出，均转向同一 UI 实现；演示模型工厂与默认值继续属于本 block。

安装 `npx zeron-ui add model-selector-01`。React 数据 block，不引入页面布局或模型服务，可嵌入现有消息输入框的操作区。

弹层最大宽度为 360px，演示输入框保持原来的 512px 最大宽度，窄屏继续按视口收缩。示例使用 `@lobehub/icons` 的 Claude Color logo 表示 Opus、Sonnet、Haiku，Auto 保留自动选择符号；Registry 会同时安装图标依赖。图标按具体入口导入，保留库提供的品牌图形与颜色。

```tsx
"use client";
import { useState } from "react";
import { ModelSelector, createModelSelectorDemoModels, modelSelectorDemoValue, modelSelectorZhLabels } from "@zeron/blocks/model-selector-01";

export function ModelSelectorPreview() {
  const [value, setValue] = useState(modelSelectorDemoValue);
  return <ModelSelector models={createModelSelectorDemoModels("zh-CN")} value={value} onValueChange={setValue} locale="zh-CN" labels={modelSelectorZhLabels} />;
}
```

Registry 消费项目使用 `@/components/blocks/model-selector-01`。`models` 由宿主提供，id 必须唯一且非空。`icon` 接收字母或装饰图标；`ratings` 为可选的 1–5 档评分，费用越高代表越昂贵；缺失时显示动态变化。`firstTokenSeconds` 和 `costPerMillionTokens` 继续作为可选元数据供宿主使用，精简下拉不再显示延迟、费用金额或底部键盘提示；`locale` 和 `currency` 参数保留以兼容旧调用。本地化文案由 `labels` 提供。

`value` 是 `{ modelId, extendedThinking, webSearch }`，`onValueChange` 返回完整对象。block 不私自修正过期 modelId，也不修改宿主数据；模型未匹配时触发按钮显示选择模型。空列表显示空状态；`models[].disabled` 禁止选择对应模型，`disabled` 禁止整个选择器并关闭可见面板。宿主负责真实模型、请求、持久化、能力校验和错误恢复。

`onValueChange` 只在实际选择变化时触发；再次选择当前模型只关闭面板。键盘高亮是独立的临时状态：宿主修改 `value.modelId` 或重新打开面板时，同步回到当前可用选择；高亮选项被移除或禁用时，回退到可用选项。更新高亮不重建输入节点，保留键盘焦点。`aria-current` 标记宿主确认的模型，选项通过 `aria-describedby` 提供用途说明和完整评分。

`open`/`onOpenChange` 提供受控展开；否则使用 `defaultOpen`。`side` 和 `align` 适配宿主定位。方向键导航、回车确认、Escape/外部点击关闭由 Command 和 Popover 处理。开关保留完整选择值并保持弹层打开。面板限宽，长列表可滚动，长说明可换行。

Popover 直接承载原 ContainerBody 中的模型列表与两个设置，不再套用 Container、ContainerBody 或 ContainerFooter。使用 Popover 默认的表面和圆角，外层保持 `overflow-visible`，保留背景层的完整阴影。单一内容包装层只负责容器查询、内边距、可用高度限制与滚动，不绘制额外背景或边框。Command 使用内容自然高度，长模型列表保留独立限高；窄屏文本换行或高度不足时仍允许必要滚动。

窄容器会将评分移到模型说明下方，并在每个评分上方显示对应标签，避免 logo 和评分列挤掉模型名称。较宽容器保持原来的并列布局，列表项垂直内边距始终为 `py-1.5`。

示例使用 InputMessage 的 `leftSlot`，无需重写消息输入组件；InputMessage 需单独安装。示例模型版本、相对评分、首字延迟与价格仅复现截图，不代表真实可用模型或当前价格。
