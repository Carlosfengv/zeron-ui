---
schema_version: 1
name: auth-layout
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 面向登录、注册与身份验证流程的全高居中布局容器，支持响应式限宽及可选顶栏与底栏区域。
package_import: "@zeron/ui/auth-layout"
registry_import: "@/components/ui/auth-layout"
source: packages/ui/src/components/auth-layout.tsx
registry: packages/ui/registry.json
related:
  - app-shell
  - page-layout
  - field
  - button
---

# AuthLayout

## 视觉角色与空间配比（Design & Spatial Rules）

- **聚焦单一任务的留白艺术**：认证与入驻页面需要极致的安心感与专注度。`AuthLayout` 独占视口（不包裹业务侧边栏 `AppShell`），将核心表单约束在黄金窄栏（约 `380px~440px`）并垂直居中，四周保留充足的 `surface-base` 呼吸留白。
- **克制的元素层级**：中心区域仅放置品牌标识、简明标题、核心凭证表单（`Field` + `Input`）、唯一主行动按钮及第三方 OAuth 快捷入口；法律条款或帮助链接置于低对比度的 footer 槽位。

## Use when

- 构建独立登录（`login-01`）、注册（`signup-01`）、找回密码、SSO 授权确认或首次工作区创建页面。

## Do not use when

- 已登录状态下的常规业务页面或后台管理视图：使用 `AppShell` + `PageLayout`。

## 公共契约与安全定制

- 使用 `AuthLayoutContent` 控制限宽，以 `AuthLayoutHeader`、`AuthLayoutBody` 和 `AuthLayoutFooter` 组合内容，不要在 `AuthLayout` 外层再套一层带导航栏的 `AppShell`。

## 工作区集成示例

```tsx
import type { ReactNode } from "react";
import { AuthLayout, AuthLayoutBody, AuthLayoutContent, AuthLayoutFooter, AuthLayoutHeader } from "@zeron/ui/auth-layout";

export function SignInFrame({ children }: { children: ReactNode }) {
  return <AuthLayout>
    <AuthLayoutContent size="sm">
      <AuthLayoutHeader><h1>登录工作区</h1></AuthLayoutHeader>
      <AuthLayoutBody>{children}</AuthLayoutBody>
      <AuthLayoutFooter><a href="/help">登录帮助</a></AuthLayoutFooter>
    </AuthLayoutContent>
  </AuthLayout>;
}
```
