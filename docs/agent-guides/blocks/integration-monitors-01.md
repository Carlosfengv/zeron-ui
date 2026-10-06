---
schema_version: 1
name: integration-monitors-01
kind: block
status: stable
summary: 集成监控列表，含分类、检查条带、筛选搜索、分页与宿主操作。
registry_import: "@/components/blocks/integration-monitors-01"
source: packages/blocks/src/application/integration-monitors-01/integration-monitors.tsx
types: packages/blocks/src/application/integration-monitors-01/integration-monitors-types.ts
registry: packages/blocks/registry.json
related: [security-overview-01, deployment-detail-01, project-monitor-01, model-router-01, container, status-overview, data-table]
---

# 集成监控

可嵌入的 React data-block，最大宽度 768px，不新增应用外壳。Container 管理外框，Tabs 管理分类，Select / InputGroup 管理筛选搜索，InfoItem / Avatar / Badge 管理行身份与状态，StatusOverview activity 管理检查项，Dropdown / MenuItem 管理操作。useDataTable 管理客户端分页，Button 组合数字页码。

```tsx
import { IntegrationMonitors, createIntegrationMonitorsDemoData } from "@/components/blocks/integration-monitors-01";

export function IntegrationPreview() {
  const data = createIntegrationMonitorsDemoData();
  return <IntegrationMonitors scopeId={data.scopeId} data={data} />;
}
```

## 数据与查询

data 必须与 scopeId 一致。完整 items 集合才可使用本 block 的客户端分类和分页；不要传服务端分页子集。scopeId 为工作区标识，snapshotId 为快照版本，updatedAt / lastCheckedAt / checks.checkedAt / mutedUntil 使用 UTC 毫秒。集成 id、integrationId 与检查项 id 必须稳定且唯一。assetCount 为非负安全整数或 null；checks=null 表示未知，[] 表示确认无检查项。

运行状态 active / paused / needs-setup 与检查结果 passed / failed / warning / unknown 分离。active 存在失败才归入 failing；存在检查且全部通过才归入 compliant；paused 与 needs-setup 归入 inactive。其余显示结果待确认，不算全部通过。顶部数量为集成条数，行内数量为检查项数。暂停使用未知色条带，Tooltip 明确显示历史结果；待配置不绘制虚构条带。条带是检查项集合，不能解读成时间轴。

query / onQueryChange 支持受控查询；defaultQuery 仅用于初值。分类、集成、运行状态、名称/描述搜索取交集，筛选重置页码。默认每页 3 条。删除或刷新后 pageIndex 校正至最后有效页。类别数量基于完整快照，导出回调 items 包含所有匹配项而非当前页。scopeId 切换重置局部状态，隔离旧操作反馈。

## 状态与操作

state 支持 ready / loading / stale / error，refreshing 与 stale 可共存。默认 retainDataOnError=true，刷新失败时保留同工作区快照并提示；无快照使用 Alert。空集合与筛选无结果分别使用 Empty。传 now 才启用相对时间；默认格式化实际时间。缺失值不显示为零，不在 render 中读取当前时间。

actions 提供连接、配置、检查、编辑、暂停、恢复、移除、详情、资产、导出、分享、静音、管理及重试。未提供 callback 的入口隐藏；单行可通过 capabilities 限制操作。回调携带 scopeId / snapshotId，宿主负责权限、请求、超时、取消和快照更新。返回 Promise 时按钮等待完成，同一行防重，检查全部与单行操作互斥。失败显示可读提示。卸载、工作区切换或目标删除后忽略旧反馈。

shareUrl 可作为无分享回调时的复制地址，仅支持 http(s) 或单斜线开头的站内路径，拒绝反斜线和会被浏览器移除的制表符、换行符。默认不猜测生产分享地址。labels 可覆盖文案，locale / timeZone 控制数字和日期。默认 zh-CN / Asia/Shanghai。

宿主仍应遵守类型契约。运行时遇到不支持的检查结果值，计数、状态条和提示文字统一按 unknown 处理；不会误读其他文案字段或对象原型成员。

## 安装与演示

Registry 安装闭包包含上述公开组件及其依赖，兼容 React 消费项目，不依赖 Next 路由。保持品牌蓝、语义状态色、组件尺寸和 StatusOverview 的响应式标签/摘要结构。数字分页为公开 Button 组合，无新增分页 primitive、全局样式或 UI 依赖。

文档演示使用 18 个确定性集成，初始失败 6、通过 8、未启用 4。可添加 Dropbox 等集成并配置；移除后重新添加得到待配置项。立即检查生成通过的示例检查。详情和资产通过 Zeron Dialog 展示本地数据，CSV 导出全部匹配项并转义引号与公式前缀，分享复制可恢复筛选和页码的 demo 链接，静音有到期时间。演示不连接真实服务；生产使用替换数据和 actions。

品牌图标复用已安装的 `@thesvg/icons`，按稳定 integrationId 匹配 18 个品牌，在列表与添加菜单中通过 Avatar 显示。黑白标志沿用语义前景色以适配浅色、深色主题；宿主传入 logoSrc 时优先使用该图片。当前图标包没有 Mercury、Harmonic、Synthesia，保留首字母回退。不要将 Mercurial 图标用作 Mercury。

行内 StatusOverview activity 使用 label=null：状态条独占上方整行，不显示“检查项”标签或预留标签列；下方左侧显示检查结果，右侧显示资产数量。无障碍名称、检查结果颜色和条带键盘操作保留。

状态区域（条带、检查结果与资产数量）左侧对齐 InfoItem 标题/描述，右侧延伸至列表内容末端。外层使用现有间距单位避开 lg Avatar 的宽度与 InfoItem 间隔；窄屏仍保持同一对齐关系。

分类 Tabs 使用 TabItem 的 leading 插槽承载现有 Badge plain：存在失败为 danger 红点，全部通过为 success 绿点，未启用为 neutral 灰点；全部不加圆点。圆点为装饰，分类名称和计数仍提供完整无障碍名称。Registry 闭包包含 badge。
