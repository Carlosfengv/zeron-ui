---
schema_version: 1
name: cost-estimate-01
kind: block
status: stable
summary: 四项受控用量、月付/年付 Tabs、最低消费补差和保存快照的嵌入式费用估算器。
registry_import: "@/components/blocks/cost-estimate-01"
source: packages/blocks/src/application/cost-estimate-01/cost-estimate.tsx
types: packages/blocks/src/application/cost-estimate-01/cost-estimate-types.ts
registry: packages/blocks/registry.json
related: [container, slider, chart-primitives, tabs, credit-usage-01]
---

# 费用估算

React data-block，不创建应用外壳。外层 Container，汇总与用量两块 ContainerBody，头尾使用 ContainerHeader / ContainerFooter；默认最大宽度 576px，标题 text-body / font-medium。保留组件表面、间距和控件尺寸，分类颜色由 ingest / storage / queries / seats → chart-1 / 2 / 3 / 4 固定映射提供；堆叠条、Badge dot、字段圆点和 Slider 填充共用 `chartColor(index)`，独立于品牌和状态色。

四项类别名称按用户要求保留英文 Ingest / Storage / Queries / Seats，在费用构成与用量输入中一致使用；其他默认文案仍为中文，labels 可单独覆盖。

```tsx
import { useState } from "react";
import { CostEstimate, costEstimateDemoInputs, costEstimateDemoRateCards, costEstimateDemoRegions, costEstimateDemoPresets } from "@/components/blocks/cost-estimate-01";

export function EstimatePreview() {
  const [value, setValue] = useState(costEstimateDemoInputs);
  return <CostEstimate value={value} onValueChange={setValue} rateCard={costEstimateDemoRateCards[value.regionId]} regions={costEstimateDemoRegions} presets={costEstimateDemoPresets} defaultInputs={costEstimateDemoInputs} />;
}
```

示例价表仅用于演示。生产宿主提供地区、费率、权限与保存服务。核心不发起查询、不拥有全局 Toast，也没有真实税费/合同/阶梯价引擎。

## 计算与归属

value/onValueChange 受控；控件产生的原因是 field/preset/reset/billing。预设只更新四项用量，保留区域和计费方式；defaultInputs 的重置恢复整组。presets、regions 和 limits 由调用者提供；省略 limits 使用固定演示范围。顶部仅保留标题与说明，区域由宿主设置 value.regionId，block 不呈现区域选择、设置或关闭入口。配置不能负值/非有限，step > 0 且至少 0.000001，(max − min) 必须整除 step；保留天数/席位为整数，用量支持最多六位小数且必须落在 step 网格。压缩比同样必须在六位小数精度内大于零，避免量化后成为零除数。

费率 regionId 必须匹配 value.regionId；宿主切区域时使用请求序号或 AbortController 避免旧响应覆盖。loading/error 隐藏金额；缺少价表显示 Empty；stale 显示旧结果但禁用保存。非法值不能冒充零，calculateCostEstimate 返回 null。费率 version 或任何定价字段变化都生成新的 fingerprint。

ratesMicros 是非负十进制整数字符串，表示百万分之一主货币单位。计算使用整数有理数与 HALF_UP，结果金额是安全整数最小货币单位；按分项舍入后求和，再单列最低消费补差。货币精度由 minorUnitDigits 定义，不固定为两位。超出可安全表示的年额范围拒绝计算。所有返回值都可 JSON 序列化。

摄入量 = 日量 × billingDays；稳定存储 = 日量 × retentionDays ÷ compressionRatio；查询独立按 TB/month；收费席位 = max(seats − includedSeats, 0)。年付折扣作用于四项用量费用，不作用于最低消费补差。年额为同月等效金额 × 12，节省以相同输入的月付基线 × 12 对比；不是 365 天精算。

图形和整数百分比表示折扣后用量费用分布，不包含最低消费补差。费用条使用共享 SegmentedBar distribution，不再单独使用 Recharts；每段 rounded-sm、段间 gap-0.5（默认 2px）。图形使用实际金额；显示比例最大余数分配，稳定合计 100%；零值段不占间距，全零显示零用量而不伪造色块。每 GB 综合费率在零摄入时未知。旁置分项金额/比例可读列表固定为 2×2，每项 badge 与价格水平排列，有限宽度内价格与比例可换行，不依赖图表 hover。

## 输入与保存

Slider 使用公开 variant="ticks"：等距长短竖刻度、分类色填充、胶囊手柄、轻微按压反馈和 spring 定位。tickCount=41 只决定视觉密度，保持原有 min/max/step 与键盘精度；减少动态效果时立即定位。renderTooltip 显示当前用量和对应换算，通过 Tooltip Portal 避免 Body 裁切，支持悬停、拖动和键盘聚焦。宽屏为标签/输入、轨道、金额/单价三列；窄屏轨道独占一行并显示辅助说明。

Slider 实时更新本地模型，不每帧请求网络。精确 Input 在 Enter/blur 校验后按 step 归一，非法/未提交草稿禁用保存，Escape 恢复。预设/重置清除草稿。自定义用量不会标为错误预设。当前未提供单值提交事件，因此不要假设 Slider 有 onValueCommit。

actions.onSave 回调拿到点击时独立的 CostEstimateResult。调用者立即同步置 saveState={status:"pending"}，再保存；即时重复点击有事件保护，异步期间以受控 pending 为准。完成传 succeeded + 同次 snapshot.fingerprint；只有与当前结果匹配且没有草稿才显示已保存。保存时可继续编辑，旧响应不得标记新结果。error 状态带 message 并允许重试。宿主负责任务取消/归属及真正持久化。

没有 onSave 的保存入口隐藏；onRetry 可选。默认中文，labels 和 locale 可覆盖。计费选择用 Tabs variant="pill" color="default"，TabsList 在汇总行右对齐，TabPanel 承载对应计费的优惠与费用构成；预设用动作 Button。Slider/Input 均具独立实例 ID 与名称；公开 fillStyle 仅适配分类色，保持原语焦点和拖动能力，不写内部选择器或改 UI 源码。

## Demo 与验收

文档 demo 默认使用 us-east 的 USD 示例费率，提供 Startup/Hobby/Scale、正常/加载/过期/错误/无价表、失败保存重试和实际示例 JSON 下载。另一份 eu-demo 价表供宿主区域适配使用，没有区域选择或关闭/重开界面。定时器/下载 URL 清理；导出标记 demonstration=true、tax=excluded。示例不是实际报价。

基准月 30 天、压缩 5×、含 3 席位：Startup 月付 586.00；Hobby 用量 21.08 加补差 27.92 得 49.00；Scale 月付 7468.00，年付月等效 6347.80、年额 76173.60、节省 13442.40。
