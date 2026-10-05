---
schema_version: 1
name: sidebar-identity-row
kind: component
status: stable
locale: zh-CN
summary: 侧栏身份信息与折叠布局
package_import: "@zeron/ui/sidebar-identity-row"
registry_import: "@/components/ui/sidebar-identity-row"
source: packages/ui/src/components/sidebar-identity-row.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: ["sidebar", "sidebar-account-menu"]
---

# sidebar-identity-row

## 关键契约

- primary、description、leading、trailing 是公开内容插槽；layout 为 auto/single-line/two-line。
- 静态身份使用默认 div；确有动作时使用 as="button" 并接入回调或菜单，不添加假操作。
- 使用 trailingPlacement="edge" 把尾部内容放到行末，保留组件自己的字体、间距与截断。
- 此行不自动变成折叠头像：调用方根据 useSidebar 的 state/isMobile 选择紧凑头像或完整身份；账户菜单使用自己的 compact 参数。不要猜测每个身份组件都会自动响应 Sidebar 状态。

## 最小正确组合

工作区 import 展示公开 API；消费者使用实际安装别名。以下例子完整定义业务输入，不代表已经接入后端。

```tsx
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
export function WorkspaceIdentity({ name }: { name: string }) {
  return <SidebarIdentityRow primary={name} description="生产工作区" leading={<SidebarIdentityAvatar tone="brand">Z</SidebarIdentityAvatar>} />;
}
export function WorkspaceAction({ onOpen }: { onOpen: () => void }) {
  return <SidebarIdentityRow as="button" type="button" primary="切换工作区" onClick={onOpen} />;
}
```

## 业务适配与样式边界

菜单名称、稳定值、路由、账户数据和权限条件由项目维护；接口、筛选和请求状态在业务页面或数据适配器接入。公开 props/slots/render 承接这些变化，不修改受管理组件内部实现。

控件 size/variant、内容 surface、focus/disabled/loading 和交互反馈由组件拥有。宽度与业务内容排列可按公开契约调整；不要逐处覆盖颜色、内边距、圆角、阴影或内部 data-slot。品牌、字体与图标通过已支持的主题/provider 入口统一配置。能力不足时先记录实际公开 API 的缺口，再实现最小业务组合。

## 浏览器验收

验证桌面与手机、长中文标签、折叠/展开和键盘路径；导航必须改变正确业务内容，异步/权限状态不能只演示选中样式。确认图标/标签对齐、滚动归属和弹层焦点。页面任务通过同版本 task-context 入口获取必要组合规则，消费者自查见 consumer-verification；未运行状态如实记录。
