---
schema_version: 1
name: transaction-details-01
kind: block
status: stable
summary: 可嵌入的交易详情，含金额、详情列表、可折叠账单和附件操作。
registry_import: "@/components/blocks/transaction-details-01"
source: packages/blocks/src/application/transaction-details-01/transaction-details.tsx
types: packages/blocks/src/application/transaction-details-01/transaction-details-types.ts
registry: packages/blocks/registry.json
related: [deployment-detail-01, container, detail-list, accordion, info-item]
---

# 交易详情

嵌入式 React data-block，宽度上限 448px，不包含路由或模态外壳。Container 提供 raised 外框和 floating 主体，两个 DetailList 使用公开 className 组合左对齐字段，账单使用 Accordion，附件使用 InfoItem。金额使用新增语义 text-display，窄容器降到 heading。

付款人和付款人邮箱的值外层不添加边框或 padding；付款人保留头像与姓名间距。账单 section 使用 rounded-xl 与语义细边框，不额外添加背景或 padding；展开背景和内容内边距由 Accordion 自身提供。状态 Badge 使用公开 status/size 参数，图标与文字通过 flex 内容组合居中。

```tsx
import { TransactionDetails, transactionDetailsDemoData } from "@/components/blocks/transaction-details-01";

export function TransactionPreview() {
  return <TransactionDetails transactionId={transactionDetailsDemoData.id} data={transactionDetailsDemoData} />;
}
```

## 数据

transactionId 必须与 data.id 相符；不相符时不显示旧交易。金额是安全整数 amountMinor，加 currency 币种；null 为未知。按币种精度和 locale 格式化，不通过浮点金额计算业务余额。交易类型和状态只接受公开枚举，未知值显示 —。occurredAt 为含时区的 ISO 日期时间字符串，日期必须在日历中存在，小时为 00–23；非法日期不自动顺延。timeZone 为 IANA 时区；默认 zh-CN / Asia/Shanghai，时区标签跟随冬夏令时。账户只传品牌和后四位，可选 logoUrl，付款人头像失败使用首字母。

账单可缺省，字段缺失显示 —。attachments 为 null 表示未知，空数组表示确认无附件；文件大小为字节数，null 表示未知。附件的 id 必须在同一交易内唯一。

## 状态与动作

state 支持 ready/loading/empty/error/stale；refreshing 可与 stale 共存。首次失败显示 Alert，确认无数据显示 Empty。默认 retainDataOnError=true，存在同一交易数据时失败保留旧快照并明确提示；可设 false 隐藏详情。宿主负责请求、超时和数据更新。

actions 提供下载收据、分享、关闭、重试、打开/下载附件；未提供能力的入口隐藏。顶部更多可复制交易编号和发票号。各异步动作等待返回 Promise，同动作防重，不锁定其他操作；失败给出可读反馈。交易切换或卸载后不接收旧动作反馈，关闭不会取消外部服务。

billingOpen/onBillingOpenChange 为受控折叠；defaultBillingOpen 默认为 true，用于非受控模式，切换交易重置局部状态。labels 可覆盖文案，locale 决定内置中英文文案与格式化。

## 安装与演示边界

通过 Registry 安装 transaction-details-01，依赖闭包包含 Container、DetailList、Accordion、Avatar、Badge、Button、Dropdown、InfoItem、Tooltip 和状态反馈组件，沿用安装主题的 display token。兼容 Next 和 Vite。不要额外创建新的应用外壳或全局样式。

文档 demo 使用示例数据；生成有效的 INV-1430.pdf，可预览或下载；分享只展示示例摘要。关闭详情后，未完成的演示操作不会打开弹窗或触发下载；立即重新打开也不会接收上一轮的演示结果。生产使用时替换 actions 和数据源。点击回调不代表付款、审批或分享服务已经接通。
