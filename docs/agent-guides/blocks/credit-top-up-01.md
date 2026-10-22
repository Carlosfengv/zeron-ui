---
schema_version: 1
name: credit-top-up-01
kind: block
status: stable
locale: zh-CN
summary: 额度充值面板，结合三类用量趋势、月度分布、耗尽预测与套餐选择。
package_import: "@zeron/blocks/credit-top-up-01"
registry_import: "@/components/blocks/credit-top-up-01"
source: packages/blocks/src/application/credit-top-up-01/credit-top-up.tsx
types: packages/blocks/src/application/credit-top-up-01/credit-top-up-types.ts
registry: packages/blocks/registry.json
related: [container, card, chart, chart-primitives, radio-group, button, inline-notice, icon-context]
---

# 额度充值

React data-block，导出 CreditTopUp、createCreditTopUpDemoData、中英文 labels 和公开类型。没有应用外壳，可嵌入计费页面或对话框。

```tsx
import { CreditTopUp, createCreditTopUpDemoData } from "@/components/blocks/credit-top-up-01";

export function CreditPurchase({ beginCheckout }: { beginCheckout: (id: string) => Promise<void> }) {
  return <CreditTopUp data={createCreditTopUpDemoData()} defaultPackageId="standard"
    onConfirm={async selected => { await beginCheckout(selected.id); }} />;
}
```

beginCheckout 是宿主实现的结账入口。真实宿主应传入服务端用量和套餐数据，重新校验报价、权限和可用性；组件不支付、不持久化、不直接修改余额。

snapshotAt / resetsAt 是 epoch 毫秒。月度用量取各分类 periodCredits 总和，recentCredits 和 history 保留独立含义。日均用量为零时不显示耗尽日期或可用天数；不足一天使用 lessThanDay 文案，不向上取整为一天，非有限的套餐天数估计省略。超额时剩余量为零，SegmentedBar 保留 overflow 状态。无效数值、重复 ID、无效日期或套餐报价显示错误并阻止提交。

usage 项包含稳定 id、label、periodCredits、recentCredits、description、可选 icon、colorIndex（1–7）、chart（stem/area/bar）和 history。history 按原始顺序展示，label 可重复；空历史显示空态。图表通过 ChartContainer / Recharts 绘制，支持提示和键盘浏览；sr-only 语义表保留屏幕阅读器可访问的原始数据，不显示展开入口。colorIndex（1–7）指定稳定的图表分类色索引。每个类别的左侧标题、图标、图表与右侧分段条、图例统一调用公共 chartColor，列表重排不改变颜色。演示恢复原分段条配色：客服回复为 chart-5 紫色、代码审查为 chart-1 蓝色、研究为 chart-3 橙色；低透明度茎线和面积填充保留层次。

packages 包含稳定 id、整数 credits、主要币种单位 price、三字母 currency 和可选 disabled。packageId 是受控值，defaultPackageId 是初始值；未指定时选择第一个可用项，初始为空的异步列表到达后也会初始化，之后重排不会改变选择。显式或失效选中 ID 不被静默替换，失效时阻止确认。onPackageChange 返回 ID；受控选择等待宿主更新。onConfirm 返回 void 或 Promise，接收完整套餐，pending 期间锁定选择与操作并防止重复确认，拒绝后展示 confirmError。宿主切换套餐或更换同 ID 的报价会清除旧错误；切换后旧请求的失败也不附加到当前选择。外部 isSubmitting 可同步宿主状态。缺少 onConfirm 时按钮禁用；只有提供 onCancel 时展示取消按钮。确认成功后由宿主关闭或刷新。

state=ready/loading/error，errorMessage / onRetry 提供恢复。disabled 锁定套餐与确认，取消仍可用；pending 时取消也锁定。空套餐展示提示并禁用确认；空 usage 展示空态。locale / timeZone 分别控制格式：无效 locale 回退 en-US，无效时区回退 UTC，保留有效的 locale。labels 可覆盖所有文案；价格按宿主报价格式化，最多保留 20 位小数，不重新计算金额。数据派生结果、格式器和活动卡片复用稳定引用，更新 data / usage / labels 时应提供新对象，避免原地修改。

Container / ContainerBody 负责表面，Card 负责活动卡片，普通布局负责双栏与套餐行。外层 @3xl 容器断点切双栏，窄容器纵向排列，宿主负责页面滚动。分类颜色使用现有 chart 变量，随明暗主题适配；确认按钮使用 primary 主题色，不覆盖控件内部状态。演示的取消和状态切换会重新建立组件以清除上一轮错误，真实关闭行为仍由宿主决定。
