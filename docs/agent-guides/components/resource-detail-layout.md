---
schema_version: 1
name: resource-detail-layout
kind: component
status: stable
locale: zh-CN
summary: 为资源详情提供稳定的摘要、动作、标签与主辅内容结构，数据和路由由调用者接入。
package_import: "@zeron/ui/resource-detail-layout"
registry_import: "@/components/ui/resource-detail-layout"
source: packages/ui/src/components/resource-detail-layout.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [page-layout, resource-detail-page-01, button, tabs]
---

# ResourceDetailLayout

## 使用与选型

用于单资源检查、配置或详情页。需要业务参考时进一步读取 resource-detail-page-01；复杂表单不应直接改写此布局源码。沿用现有应用外壳，不在详情内嵌入第二套导航外壳。

## 公共槽位

| 参数 | 归属 |
| --- | --- |
| title／description | 资源名称和说明；title 提供单一 h1，不把状态 Badge 放进 title |
| navigation | 表面上方的页面导航，例如面包屑 |
| recordNavigation | 关闭详情或切换相邻记录 |
| leading／status | 资源标志与独立状态 |
| actions | 页面级资源操作 |
| tabs | 受控 TabsList 或路由导航；布局不自动管理激活路由 |
| children | 主内容，读取／保存行为由调用者拥有 |
| aside／asideLabel | 辅助事实与可访问名称；有 aside 时提供名称 |

`asideSide` 默认 right，`asideWidth` 默认 20rem，`columnsAt` 默认 xl。`scrollMode="body"` 默认共享正文滚动；columns 模式在相应桌面断点让主辅栏分别滚动，堆叠时仍回到共享正文。宿主提供有界高度，不再嵌套同区域的滚动层。

## 业务接入边界

```tsx
import type { ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { ResourceDetailLayout } from "@zeron/ui/resource-detail-layout";
export function ResourceDetail({ resource, children, facts, onBack, onEdit, canEdit }: {
  resource: { id: string; name: string; description: string; status: string };
  children: ReactNode; facts: ReactNode;
  onBack: () => void; onEdit: (id: string) => void; canEdit: boolean;
}) {
  return <ResourceDetailLayout title={resource.name} description={resource.description}
    status={<span>{resource.status}</span>}
    recordNavigation={<Button type="button" variant="ghost" onClick={onBack}>返回列表</Button>}
    actions={<Button type="button" variant="secondary" disabled={!canEdit} onClick={() => onEdit(resource.id)}>编辑资源</Button>}
    aside={facts} asideLabel="资源信息" scrollMode="body">
    {children}
  </ResourceDetailLayout>;
}
```

## 状态与路由

调用者按资源 ID 读取，拒绝晚到的旧资源响应。返回列表时保留查询／分页条件；前后记录切换明确依照当前列表顺序。区分加载、不存在、请求失败、无权读取和可以读取但不能编辑。API 失败保留可重试上下文，后端核验读取与修改权限。

不要给未知资源制造名称或状态。上例要求调用者已经取得有效资源，不能将硬编码对象称为真实接口集成。

## 验收

检查 title 与 status 分离、一个 h1、动作权限、返回条件、长描述、切换资源请求竞争、窄屏主辅栏堆叠和两种滚动模式。示例由 `agents:guides:examples:check` 做类型检查；真实接口、业务状态和视觉验收独立记录。不要复制该组件内部摘要栏到业务代码；消费者按实际 aliases 引用已安装布局。
