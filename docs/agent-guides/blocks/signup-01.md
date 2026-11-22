---
schema_version: 1
name: signup-01
kind: block
status: stable
typecheck_examples: true
locale: zh-CN
summary: 表面中性的响应式账户注册整页模板，包含邮箱注册表单及 Apple、Google 第三方注册入口。
registry_import: "@/components/blocks/signup-01"
source: packages/blocks/src/application/signup-01/signup-01.tsx
registry: packages/blocks/registry.json
related:
  - auth-layout
  - field
  - input
  - button
  - separator
---

# Signup 01

## 版式母版与跨业务设计改写（Visual Archetype & Adaptation）

- **所属页面母版**：**轻量聚焦认证与门户（Focused Auth Archetype）**。
- **空间与视觉节奏**：与 `login-01` 共享统一的 `AuthLayout` 居中窄栏尺度，确保用户在“登录 ↔ 注册”之间切换时视觉重心零跳动。
- **表单字段克制法则**：模板只收集邮箱。扩展注册流程时，将首屏字段控制在完成注册所需的最小范围；若业务需要收集行业、角色或偏好配置，应在注册成功后再通过分步向导（如 `Stepper` 或 `getting-started-01`）渐进收集，切忌把注册页拉成十几个字段的长表单。

## Use when

- 构建新用户自助注册、团队邀请接受页或试用账号开通页面。

## Do not use when

- 管理员在后台列表中新增内部成员：使用 `member-department-01` 内的抽屉或 `Dialog` 表单。

## 直接安装与集成契约

```bash
npx zeron-ui add signup-01
```

- 接入真实的注册 API、字段级校验错误与条款确认逻辑；保持与 `login-01` 互跳链接的路由一致性。

## 工作区集成示例

```tsx
import { Signup01, type Signup01Values } from "@zeron/blocks/signup-01";

export function Register({ startSignup }: { startSignup: (email: string) => Promise<void> }) {
  const submit = ({ email }: Signup01Values) => startSignup(email);
  return <Signup01 onSubmit={submit} signinHref="/login" />;
}
```
