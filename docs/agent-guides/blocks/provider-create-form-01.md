---
schema_version: 1
name: provider-create-form-01
kind: block
status: stable
typecheck_examples: true
locale: zh-CN
summary: 包含凭证校验、模型自动发现、按模型可用性配置与最终核对的三步服务商接入向导整页模板。
registry_import: "@/components/blocks/provider-create-form-01"
source: packages/blocks/src/application/provider-create-form-01/provider-create-form.tsx
registry: packages/blocks/registry.json
related:
  - page-layout
  - stepper
  - field
  - input
  - switch
  - table
  - button
---

# Provider Create Form 01

## 版式母版与跨业务设计改写（Visual Archetype & Adaptation）

- **所属页面母版**：**沉浸式分步创建向导（Stepped Setup Wizard Archetype）**。
- **空间与心流设计**：
  - **居中限宽画布**：复杂创建流程严禁铺满全屏宽表，采用舒适的居中工作宽度，顶部固定 `Stepper` 清晰指示“1. 基本信息 → 2. 验证凭证并选择模型 → 3. 确认添加”三步进度。
  - **即时校验前置**：第一步填写名称和描述。第二步选择厂商并校验 API Key，通过后展示可用模型。第三步展示只读摘要供用户确认。
  - **固定底部操作律**：每步底部右侧固定为 `[上一步 (Secondary)] + [下一步 / 完成创建 (Primary)]`，全流程视觉焦点高度稳定。
- **跨业务改写指南**：可直接作为任何**“云账号接入”、“数据源同步创建”、“Webhook / 知识库分步配置”**的标准母版。

## Use when

- 创建流程包含前后依赖的多个阶段（如“先验证连通性，再拉取远程列表，最后确认保存”），单页平铺会导致认知过载时。

## Do not use when

- 仅含 3～5 个独立字段的简单新建操作：直接使用单页 `Field` 表单或 `Dialog`。

## 直接安装与集成契约

```bash
npx zeron-ui add provider-create-form-01
```

- 替换各步骤的异步连通性校验、模型探测与最终提交回调；在异步校验进行中锁定下一步按钮并展示 `loading` 状态。

## 工作区集成示例

```tsx
import { ProviderCreateForm, type ProviderCreateFormProps } from "@zeron/blocks/provider-create-form-01";

export function ConnectProvider(props: Required<Pick<ProviderCreateFormProps, "onVerifyAndFetchModels" | "onSubmit">>) {
  return <ProviderCreateForm {...props} defaultValues={{ name: "", description: "", apiKey: "", models: [] }} />;
}
```
