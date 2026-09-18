---
schema_version: 1
name: user-account-01
kind: block
status: stable
summary: 统一登录用户的受控偏好与账号操作入口。
package_import: "@zeron/blocks/user-account-01"
registry_import: "@/components/blocks/user-account-01"
source: packages/blocks/src/application/user-account-01/user-account.tsx
registry: packages/blocks/registry.json
related:
  - sidebar-account-menu
  - personal-settings-01
---

# User Account

Use for a signed-in user's account entrance in a sidebar footer or header (`menuSide="bottom"`). Reuses SidebarAccountMenu and its keyboard-accessible submenus. Supply `user`; do not embed authentication or product routes in this block.

Pair controlled `theme` with `onThemeChange`, and `locale` / `localeOptions` with `onLocaleChange`. Actions with no handler are hidden. Theme values are `system`, `light`, and `dark`. The host owns theme application, persistence, translations and route changes. Preserve search and hash when changing language. Share one preference source with PersonalSettings, supplying its `localeOptions` from the same list.

`onOpenSettings` navigates to the settings page. `onSignOut` must await the real session invalidation and then clear account data / navigate. Rejected promises leave the account visible and show localized failure copy. Pending actions are disabled; share `pendingAction` and `error` across multiple mounted entrances. Do not report success before the host completes the action.

`extraSections` adds typed menu groups; use `labels` for built-in copy. Do not insert arbitrary forms into menu semantics. Use application-owned surfaces for rich content.

`notifications` optionally connects a host-owned notification action. UserAccount does not ship a notification center. Documentation previews use `extraSections` entries without handlers and with `closeOnClick: false` for notifications and personal settings, preserving only hover, focus and active styling.

ZaiopsOperations and ResourceWorkspaceShell accept `account: UserAccountProps`. Existing resource shell `accountSections` / `onAccountAction` remain supported; `account` takes precedence. PersonalSettings retains its `account` ReactNode slot for the same block. Documentation demo sign-out affects only its example session, never a real account.

Validate keyboard navigation, rejected sign-out and retry, shared preferences, menu placement, long identity text, and static demo actions on desktop and mobile. Account covers and detail previews are centered; only the trigger has 1.6 spacing units of horizontal padding.
