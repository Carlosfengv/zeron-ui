---
schema_version: 1
name: login-01
kind: block
status: stable
typecheck_examples: true
locale: zh-CN
summary: 基于 AuthLayout 与 Card 构建的响应式身份登录整页模板，覆盖账号密码与 Apple/Google 第三方登录路径。
registry_import: "@/components/blocks/login-01"
source: packages/blocks/src/application/login-01/login-01.tsx
registry: packages/blocks/registry.json
related:
  - auth-layout
  - card
  - field
  - input
  - button
  - separator
---

# Login 01

## 版式母版与跨业务设计改写（Visual Archetype & Adaptation）

- **所属页面母版**：**母版 6 · 轻量聚焦认证与门户（Focused Auth Archetype）**。
- **空间与视觉重心**：采用全屏无干扰的 `AuthLayout` 居中画布，核心卡片限宽紧凑，自上而下依次为：*品牌与标题区 → 第三方快捷登录（Apple / Google）→ `Separator` 细线分割 → 账号/密码 `Field` 表单与唯一高强调提交按钮 → 底部注册跳转引导*。
- **如何改写为其他登录场景**：
  - **企业 SSO / 手机验证码登录**：保留外层 `AuthLayout` 与 `Card` 呼吸间距，将表单区切换或结合 `Tabs variant="segment"`（“密码登录 / 验证码登录”），保持整页只有 1 个高强调主提交按钮。
  - **去侧栏原则**：认证页作为独立路由渲染，外部不要包裹业务后台的 `Sidebar` 或 `TopNav`。

## Use when

- 为 SaaS 产品、AI 工作台或企业后台构建标准登录页，需要开箱即用的邮箱密码提交、字段错误反馈与第三方 OAuth 入口。

## Do not use when

- 用户已处于登录态，仅需在弹窗中二次验证敏感操作密码：使用 `Dialog` + `Field`。
- 创建新账户流程：使用配对的 `signup-01`。

## 直接安装与集成契约

```bash
npx zeron-ui add login-01
```

- 将表单提交、第三方登录跳转、忘记密码与注册路由绑定到真实认证服务回调；提交期间启用主按钮 `loading` 状态并通过 `Field` 或顶部 `Alert` 呈现服务端认证错误。

## 工作区集成示例

```tsx
import { Login01, type Login01Props } from "@zeron/blocks/login-01";

export function SignIn(props: Pick<Login01Props, "onSubmit" | "errors" | "pendingAction" | "onGoogleLogin" | "onAppleLogin">) {
  return <Login01 {...props} signupHref="/signup" forgotPasswordHref="/reset-password" />;
}
```
