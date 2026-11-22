---
schema_version: 1
name: personal-settings-01
kind: block
status: stable
typecheck_examples: true
locale: zh-CN
summary: 覆盖模型服务、API 密钥、访问凭证、个人资料与用量概览的多视图个人设置工作台模板。
registry_import: "@/components/blocks/personal-settings-01"
source: packages/blocks/src/application/personal-settings-01/personal-settings.tsx
registry: packages/blocks/registry.json
related:
  - app-shell
  - sidebar
  - page-layout
  - card
  - field
  - input-copy
  - button
---

# Personal Settings 01

## 版式母版与跨业务设计改写（Visual Archetype & Adaptation）

- **所属页面母版**：**分组导航设置中心（Categorized Settings Workspace Archetype）**。
- **空间与呼吸感法则**：
  - **左局部导航 + 右居中限宽表单区**：当设置项跨越多个维度（个人资料、API Keys、模型服务商、安全凭证、账单用量）时，左侧提供清晰的分类导航栏，右侧内容区**必须限制在舒适阅读宽度（`max-w-3xl` / `PageLayout size="md"`）**，绝不让单行输入框橫跨整个宽屏显示器。
  - **卡片分组与就地保存**：每个设置小节按职责封装为语义清晰的 `Card` 或 `border-hairline` 分组，每个独立配置卡的更改操作就近放置在卡片底栏或右侧，危险操作（如吊销密钥、删除账号）单独置于页面最底部。

## Use when

- 构建 SaaS 产品的“个人设置 / 团队空间设置 / 开发者凭证与 API Key 管理中心”。

## Do not use when

- 仅需在页面一角嵌入紧凑的主题/语言/圆角外观偏好卡片：直接使用局部区块 `appearance-settings-01` 或头像下拉 `user-account-01`。

## 直接安装与集成契约

```bash
npx zeron-ui add personal-settings-01
```

- 该模板包含多视图演示数据（`readiness: "demo-only"` / 原型工作台），在生产项目中落地时，按业务实际开放的设置模块裁剪左侧分类，并将密钥生成、复制（`InputCopy`）与资料保存对接至真实后端接口。

## 工作区集成示例

```tsx
import { PersonalSettings, type PersonalSettingsProps } from "@zeron/blocks/personal-settings-01";

export function AccountSettings(props: Pick<PersonalSettingsProps, "data" | "actions" | "view" | "onViewChange">) {
  return <PersonalSettings {...props} defaultView="keys" />;
}
```
