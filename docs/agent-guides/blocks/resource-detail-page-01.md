---
schema_version: 1
name: resource-detail-page-01
kind: block
status: stable
summary: 使用共享 Workspace Sidebar、双栏概览和全宽业务 Tabs 的可适配资源详情页。
package_import: "@zeron/blocks/resource-detail-page-01"
registry_import: "@/components/blocks/resource-detail-page-01"
source: packages/blocks/src/application/resource-detail-page-01/resource-detail-page.tsx
types: packages/blocks/src/application/resource-detail-page-01/resource-detail-page-data.ts
registry: packages/blocks/registry.json
related:
  - resource-detail-layout
  - resource-workspace-shell-01
  - detail-list
  - tabs
---

# Resource Detail Page 01

## Agent intent

使用此 Block 构建带应用级左侧导航的资源详情页。它负责 Workspace Sidebar、记录导航、详情头、Pill Tabs、概览双栏和独立滚动；业务项目负责 API 查询、路由、权限、保存操作和各业务 Tab 的内容。

默认数据和图标用于 MCP 飞书示例。`data` 是必填属性；文档演示会显式传入 `defaultResourceDetailPageData`。生产接入必须传入项目数据，并通过 props 覆盖业务名称、图标和内容。不要直接修改 Block 内的默认示例数据。

## Install

消费者项目通过 Registry 安装；`@zeron/blocks` 只用于 Zeron 源码仓库内部。

```bash
npx zeron-ui add resource-detail-page-01 --dry-run
npx zeron-ui add resource-detail-page-01
```

安装会递归包含 `resource-workspace-shell-01`、`resource-detail-layout`、Sidebar、Tabs、Select、Dropdown、DetailList 和所需样式依赖。

```tsx
import {
  ResourceDetailPage,
  type ResourceDetailPageChange,
  type ResourceDetailPageData,
} from "@/components/blocks/resource-detail-page-01";
```

## Data adapter

在项目数据层把接口响应映射为稳定的 `ResourceDetailPageData`。不要把接口原始对象直接扩散到 Block，也不要用类型断言掩盖字段缺失。

```tsx
function toDetailData(response: ResourceResponse): ResourceDetailPageData {
  return {
    id: response.id,
    name: response.displayName,
    description: response.summary,
    status: response.published ? "已发布" : "未发布",
    recordIndex: response.position,
    recordTotal: response.total,
    toolCount: response.toolCount,
    callCount: response.callCount,
    source: response.source.label,
    version: response.version,
    categories: response.categories,
    categoryOptions: response.availableCategories,
    published: response.published,
    authentication: {
      endpoint: response.endpoint,
      transport: response.transport,
      credentialStatus: response.credentialStatus,
    },
    security: {
      level: response.security.level,
      levelOptions: response.security.availableLevels,
      description: response.security.description,
    },
    protection: response.protection,
    markdown: response.readmeMarkdown,
  };
}
```

`data.id` 必须是稳定资源 ID。切换资源时传入新的 `data` 对象，Block 会同步发布状态、分类、安全级别和防护设置。

## Mutation adapter

使用 `onResourceChange` 接收统一的判别联合事件，再映射到后端 mutation。原有的 `onPublishedChange`、`onCategoriesChange`、`onSecurityLevelChange` 和 `onProtectionChange` 可用于需要拆分 handler 的项目；不要同时在两组回调中重复提交请求。

```tsx
async function saveChange(change: ResourceDetailPageChange) {
  switch (change.type) {
    case "published":
      return api.updateResource(id, { published: change.value });
    case "categories":
      return api.updateResource(id, { categories: change.value });
    case "security-level":
      return api.updateSecurity(id, { level: change.value });
    case "protection":
      return api.updateProtection(id, change.value);
  }
}

<ResourceDetailPage
  activeNavigation="mcp-services"
  data={toDetailData(query.data)}
  onClose={() => router.push("/resources")}
  onEdit={() => router.push(`/resources/${id}/edit`)}
  onNext={() => navigateRecord("next")}
  onPrevious={() => navigateRecord("previous")}
  onResourceChange={saveChange}
  onSectionChange={(section) => router.replace(`#${section}`)}
  sectionContent={{
    tools: <ResourceTools resourceId={id} />,
    scope: <ResourceScope resourceId={id} />,
    usage: <ResourceUsage resourceId={id} />,
    audit: <ResourceAudit resourceId={id} />,
  }}
  workspaceId={workspaceId}
  workspaces={workspaces}
  onWorkspaceChange={setWorkspaceId}
/>
```

Block 内部会立即更新交互状态；业务 mutation 失败时应显示错误，并通过缓存回滚或重新获取 `data` 恢复服务端状态。

## Generic resource adaptation

通过 `labels` 覆盖资源类型、按钮、记录单位、Tab 名称和无内容提示。通过 `resourceIcon`、`sourceIcon` 替换示例 SVG。

以下区域可整体替换，传入 `null` 可以移除对应可选区域：

- `detailActions`：详情头操作区。
- `detailNavigation`：顶部资源路径。
- `detailStatus`：标题状态。
- `recordNavigation`：关闭、上一条、下一条和计数区。
- `overviewAside`：概览左侧属性栏；函数形式会收到当前可编辑状态，以及 `onCategoriesChange`、`onPublishedChange`、`onSecurityLevelChange`、`onProtectionChange` 四个更新入口。
- `sectionContent`：五个 Tab 的业务内容。

当资源属性模型不是 MCP 的来源、认证、安全和防护结构时，使用 `overviewAside` 组合项目业务内容，不要修改内置 `ResourceMetadataPanel` 或复制 `ResourceDetailLayout`。

## Host shell boundary

此 Block 自带 `ResourceWorkspaceShell`。新建完整资源管理应用时，可与 `resource-list-page-01` 共享 `workspaces`、`navigation`、账户信息和回调。

如果目标项目已经拥有应用级 Sidebar，不要嵌套第二个应用壳层；直接使用 `resource-detail-layout` 组合详情内容，或在项目侧提取无 Sidebar 的业务 composition。

## Loading and errors

加载、请求失败、无权限和资源不存在属于业务查询状态，应在渲染 Block 前由页面路由处理。`data` 未就绪时不要渲染 Block；必填类型会阻止生产页面意外回退到飞书演示数据。

关闭、上一条、下一条和编辑按钮仅在传入对应回调后可用。未接入动作会保留布局但显示为禁用，避免用户触发无反馈操作；也可以通过对应的区域插槽整体替换。

## Verification checklist

- [ ] `--dry-run` 能解析全部 Registry 依赖和 SVG 文件。
- [ ] API 响应经过显式 adapter 转换为 `ResourceDetailPageData`。
- [ ] 路由接入关闭、上一条、下一条、Tab 和左侧导航。
- [ ] mutation 成功后更新查询缓存；失败时可见错误并回滚。
- [ ] 非 MCP 资源覆盖 labels、icons 和 `overviewAside`。
- [ ] 基本信息保持左右独立滚动，其他 Tab 占满详情宽度。
- [ ] 窄屏和 Sidebar 折叠态可恢复，Workspace Avatar 正确显示。
