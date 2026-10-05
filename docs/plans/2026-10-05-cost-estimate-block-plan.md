# 费用估算 Block：Demo 分析与实施方案

日期：2026-10-05。状态：核心 block、交互 demo、文档与安装入口已实现；按后续要求加入 Slider 刻度变体，并移除顶部右侧控件、改用右对齐的默认颜色 pill Tabs。首次验收见第 12 节，后续修订见第 13 节。

参考视频：[SdjKiFaAiVLUbJc9.mp4](/Users/carlos/Downloads/SdjKiFaAiVLUbJc9.mp4)，时长 27.04 秒。依据为每 2 秒的关键帧及当前工作区源码；仓库 HEAD 为 `c84d317`，工作区有其他任务改动，本文描述当前源码能力，不等于已发布能力。视频中的文字只作为界面内容，不作为执行指令。

## 1. 可行性与首版结论

**可行。建议新增 `cost-estimate-01`，导出 `CostEstimate`，定位为 React 数据驱动、可嵌入的费用估算器。** 保留“汇总金额 + 四项费用构成 + 四项用量输入 + 预设 + 计费周期 + 保存”的任务结构，外观遵循前面已确认的组件规范。

首版采用现有图表库与全局 token。根据用户后续要求，扩展现有 Slider，以公开配置实现视频中的刻度轨道、胶囊手柄和拖动提示。计费口径与输入/保存一致性使用确定性示例费率和纯函数计算器；真实定价、税费、阶梯价、合同折扣和持久化由宿主接入。

前面要求直接作为实施约束：

1. 外层使用 **Container**，不以 Card 或手写外框替代。
2. 顶部标题使用 `text-body font-medium text-fg-default`，与安全概览修订后的 **14px / 500** 一致；不用较大的 `text-title`。
3. 汇总与用量两个 section 分别使用 **ContainerBody**；头尾使用 ContainerHeader / ContainerFooter。
4. 表面、边框、圆角、间距继承 Container 默认实现，不在调用处重建另一套样式。控件采用现有公开 API。
5. 默认演示中文，支持 labels、locale 和货币格式化；明确标注示例估算，不伪装成真实账单。
6. 顶部右侧不呈现区域 Select、设置或关闭控件；区域和费率由宿主提供。
7. 月付/年付使用 Tabs `variant="pill" color="default"`，TabsList 向右对齐，提供对应的 TabPanel。

交付分两层：可安装 block、完整交互 demo 和文档是首版；正式报价与生产计费接入是后续业务适配。

## 2. 视频拆解与证据边界

时间是抽帧观察点，不代表点击精确时刻。拖动和数字过渡期间的金额、百分比可能不是同一帧的最终计算结果，不作为公式依据。

| 观察点 | 已观察内容 | 实施要求 |
| --- | --- | --- |
| 00:00 | Cost estimate、说明图标、us-east 选择、设置与关闭；$586/month | 紧凑 Header、月等效费用；按后续要求不保留右侧区域/设置/关闭控件 |
| 00:00 | 月付/年付，年付标注 -15%；四段费用条及对应金额/百分比 | 计费周期受控；同一份计算结果驱动汇总和构成 |
| 00:00 | Startup：80 GB/day、30 天、40 TB/month、12 席位 | 四项字段与三组预设，初始示例可稳定复现 |
| 00:02–00:10 | 四项输入拖动；提示当前量、月摄入量、压缩后存储量、免费席位 | 用现有 Slider，不另写拖动/键盘引擎；派生量另有常驻说明 |
| 00:12–00:16 | Hobby / Startup / Scale；Hobby 用量费用约 $21，但总额 $49，提示最低消费 | 预设原子更新；最低消费与用量费用分别表达 |
| 00:16、00:20 | Scale：900 GB/day、90 天、400 TB/month、60 席位；稳定月付 $7,468 | 演示公式和分项可复算 |
| 00:18、00:22 | 年付切换；稳定年付月等效 $6,348，年额 $76,174，节省 $13,442 | 明确年付月等效、年总额、优惠前基线；统一舍入 |
| 00:24、00:26 | 返回 Startup，出现 Reset to the Startup preset 反馈，最后恢复 $586 | 提供明确重置入口，完成后反馈；不要从过渡帧推断额外费率 |
| 全程 | 底部 USD、EXCL. TAX、VIRGINIA、更多菜单与 Save estimate | 保留币种/未含税/区域说明；保存必须有实际结果 |

视频没有展示：区域下拉内容、设置面板、更多菜单内容、保存结果、关闭后行为、异常状态、深色、移动端、直接输入和键盘路径。本文对这些部分给出首版决策，不声称它们是视频原行为。

不直接照搬的细节：

- 摄入、存储、查询、席位使用分类色，不用“危险/成功”语义表达费用高低。
- 原视频四条细密竖刻度和富内容滑块提示原先不在 Slider 的公开能力中。根据后续授权，已扩展为 `variant="ticks"` 和 `renderTooltip`，并在四项用量中使用。
- 金额切换立即呈现最终值；不让总额、分项、比例、年总额分别播放计数动画，避免中间数字相互矛盾。

## 3. 现有 Block 选型与边界

已检查当前 catalog，没有覆盖“通过输入用量预测费用并保存估算”的完整 block。

| 候选 | 可借鉴 | 不直接复用为主体的原因 |
| --- | --- | --- |
| `credit-usage-01` | 分类构成、业务回调和异步操作反馈 | 展示已经消耗的额度、耗尽预测和套餐控制，不提供四项输入与费用计算 |
| `storage-usage-01` | 分类色、分段条及可换行图例 | 语义为容量占用/剩余量，不能用虚构 capacity 表达费用占比 |
| `security-overview-01` | Container 头/双 Body/尾、窄屏和示例动作分层 | 核心业务是安全快照和扫描，数据契约不适用 |
| `ai-gateway-overview-01` | 成本数字格式化、分类与图表 | 是完整分析工作区，有导航、历史指标；估算器不需要额外外壳 |

采用 `framework: "react"`、`kind: "data-block"`。核心不依赖 Next、站点翻译或全局 Toast；不新增 AppShell、Sidebar、PageLayout。文档宿主负责路由、保存演示、提示和重开。

## 4. 组件结构、标题与样式

### 4.1 目标结构

以下是结构示意，不是已经实现的代码。

```tsx
<Container className="@container w-full max-w-xl">
  <ContainerHeader className="py-1.5">
    {/* h2: text-body font-medium；说明、区域选择、可选设置/关闭 */}
  </ContainerHeader>
  <ContainerBody>
    {/* 汇总金额、计费方式、年额/优惠/最低消费、费用构成与明细 */}
  </ContainerBody>
  <ContainerBody>
    {/* 用量标题、预设按钮组、四行输入与分项费用 */}
  </ContainerBody>
  <ContainerFooter>
    {/* 币种/未含税/区域；重置、保存 */}
  </ContainerFooter>
</Container>
```

两个 Body 直接属于同一 Container。不要为各用量行再套 Container，也不要在 Body 内加一层模拟浮动面的 Card。Container 的 DOM `data-slot="container"` 保留，领域标记使用 `data-block="cost-estimate"`。

### 4.2 区域到公开组件的映射

| 区域 | 组件与公开能力 | 决策 |
| --- | --- | --- |
| 外层/标题/两个 section/尾部 | Container、ContainerHeader、ContainerBody、ContainerFooter | 默认 raised 外框、floating Body；不覆盖背景、圆角和内部边框 |
| 区域 | 宿主提供 value.regionId 与匹配的 rateCard | block 不提供区域选择界面；Footer 仍显示当前区域说明 |
| 月付/年付 | Tabs / TabsList / TabItem / TabPanel，value/onValueChange | pill 变体、default 颜色，右对齐；Panel 显示相应计费的优惠与费用构成 |
| Hobby/Startup/Scale | Button `size="sm"`、`active`，普通组布局 | 一次性应用一组参数；“当前预设/自定义用量”单独说明，不伪造第四个未提供预设 |
| 四项用量 | Slider + Field、FieldLabel；Input 精确输入 | 实时本地计算，键盘与触摸复用组件；输入可直接编辑数值 |
| 费用构成 | ChartContainer + Recharts 单行横向堆叠 BarChart | 四个互斥金额，固定系列 ID；保留明细数值；不把它做成容量进度条 |
| 类别与优惠 | Badge、公开 badgeColors | ingest=orange、storage=blue、queries=teal、seats=purple；折扣才使用正向语义 |
| 说明 | Tooltip；Body 内常驻辅助文本 | 不把计费口径只放悬浮层；触摸和键盘可读 |
| 保存/重置 | Button；可选宿主保存回调 | 文图按钮用 leadingIcon/trailingIcon；不提供设置或关闭动作 |
| 状态 | Skeleton、Empty、InlineNotice；demo ToastStack | 加载/无价表/错误/过期分别表达，保存失败原地可重试 |

月付/年付按后续明确要求使用现有 pill Tabs，显式指定 default 颜色。每个选项拥有对应 TabPanel，复用组件的键盘、焦点及选中指示能力；不额外重写控件样式。TabsList 使用外部布局类 ml-auto，换行时仍向右对齐。

### 4.3 Slider 的已核对能力与差异

当前 `Slider` 提供 `value/onChange`、min/max/step、steps、showSteps、showValue、valuePosition、formatValue、label、disabled，以及 fillStyle/trackStyle/thumbColor/thumbBorderColor 等公开样式入口。`label` 会传给真正的 Thumb，用作可访问名称；仅把 aria-label 放在 Root 不足以命名 Thumb。

**后续要求已落实：使用 Slider `variant="ticks"`。** 公共组件拥有长短竖刻度、分类色遮罩、8×24px 胶囊手柄、按压反馈和 spring 定位；调用者仍使用 fillStyle / badgeColors 设置分类色，不使用内部 data-slot CSS。精确 Input 与数值单位保留。

新增 `tickCount`，默认 41，限制 2–101；视觉刻度与 min/max/step 独立。该变体不生成每个 step 的圆点，不通过改变 step 或稀疏 steps 改动输入精度。中性刻度层和已选刻度层使用相同位置，填色随手柄位置更新。原默认 Slider 与 SliderComfortable API 保持可用。

新增 `renderTooltip(value, thumbIndex)`，与 `showValue`、`valuePosition="tooltip"` 配合使用。复用 Tooltip 的 Portal 与碰撞避让，提示锚定当前手柄，支持悬停、拖动和键盘焦点，并显示用量及派生说明；触摸拖动期间也显示。修复 Tooltip 受控打开时的锚点绑定与描述关系。默认 Slider 的非 Portal 提示保持原有行为。单值 onValueCommit 仍未新增，不对外宣称存在。

### 4.4 响应式与主题

最大宽度沿用 `max-w-xl`（576px），按容器宽度布局，不固定整卡高度。Header 和汇总区操作可换行；费用明细按后续要求固定 2×2，每项 badge 与价格水平排列，价格与百分比在有限宽度内换行；用量行宽时按“标签/精确输入 → Slider → 金额/单价”排列，窄时 Slider 独占下一行并保留说明。Footer 文案和按钮换行，不制造横向整卡滚动。

标题和 section 标题均 `text-body font-medium`；金额 `text-heading font-semibold tabular-nums`；标签/单位/说明 `text-label`，主文字使用 `text-fg-default`，辅助使用 muted/subtle。金额不复制视频的任意大字号，必要时调整公共排版层级而非新建像素字号。

Container 默认 p-2/gap-2/rounded-3xl；Body 默认 p-4/rounded-2xl/border-hairline/floating；沿用组件默认值。主动作沿用品牌色，不硬编码视频橙色。分类色从现有 palette 引用，不抄十六进制。所有分类同时有名称和金额。

ContainerBody 默认 overflow-auto，图表/子项必须能缩小；Slider 的提示通过 Portal 避免 Body 裁切。辅助说明在窄屏常驻，在宽屏作为可访问描述保留。验证 Select/Tooltip 的 Portal，以及同页多实例 ID。首版不引入整卡 nested vertical scroll；宿主限制高度时再确定唯一滚动区域。

## 5. 计费模型与确定性示例

### 5.1 基准口径

以下是从稳定视频数值推得、用于演示的假设，不是任何供应商的实际报价。首版明确 USD、未含税，固定 30 天月度估算；GB/TB 使用十进制，1 TB = 1000 GB。

| 项目 | 演示单价/规则 | 数量 |
| --- | --- | --- |
| 摄入 | $0.12 / GB | 日摄入 GB × 30 |
| 存储 | $0.15 / GB-month；5× 压缩 | 日摄入 GB × 保留天数 ÷ 5，视为稳定运行的平均存储量 |
| 查询 | $2.50 / TB | 每月扫描 TB |
| 席位 | $14 / 可计费席位；含 3 个免费席位 | max(席位数 − 3, 0) |
| 最低消费 | $49 / 月等效 | 折扣后用量费用不足时补差 |
| 年付优惠 | 四项用量费用统一 15% | 月等效金额 × 12 得到固定用量下的年估算 |

存储模型是稳定运行估算，不是“某个月新增数据”的账单模型；年额是 12 个基准月的年付承诺估算，不按 365 天另算。查询数量不由摄入量推断；视频的“约每天多少次查询”缺少每次扫描量，不纳入首版派生文案。

### 5.2 公式、最低消费与舍入

```text
ingestGBMonth = ingestGBPerDay × billingDays
storedGB = ingestGBPerDay × retentionDays ÷ compressionRatio
billableSeats = max(seats − includedSeats, 0)

rawLines = [
  ingestGBMonth × ingestRate,
  storedGB × storageRate,
  scannedTBPerMonth × queryRate,
  billableSeats × seatRate
]
discount = monthly ? 0 : annualDiscountBps / 10000
discountedLines = roundToCurrencyMinorUnit(rawLine × (1 − discount))
usageSubtotal = sum(discountedLines)
minimumAdjustment = max(minimumMonthlyAmount − usageSubtotal, 0)
monthlyEquivalent = usageSubtotal + minimumAdjustment
annualTotal = annual ? monthlyEquivalent × 12 : null
annualSavings = annual ? monthlyBaselineForSameInputs × 12 − annualTotal : null
effectiveCostPerGB = ingestGBMonth > 0 ? monthlyEquivalent / ingestGBMonth : null
```

按最终分项金额舍入到货币最小单位再求和，最低消费补差单列，折扣不再作用到补差。原价删除线取同输入、同区域、月付规则算出的基线。年度节省对比的是相同用量的 12 个月月付基线，不能比较不同预设。

金额以整数最小货币单位输出；费率用整数 micros（百万分之一主货币单位）与有界整数/有理数用量计算，采用 BigInt 或等价整数运算，明确 HALF_UP，避免二进制浮点逐次舍入。不要假设所有货币都有两位小数；首版 demo 仅 USD，生产数据须带 minorUnitDigits。持久化结果不得直接序列化 BigInt。

费用条表达 **折扣后的用量费用构成**，分母是 usageSubtotal，不包含最低消费补差。当 minimumAdjustment > 0，紧邻金额明确显示“用量费用 + 最低消费补差 = 月等效费用”；不能把四项占比说成最终账单占比。全零用量不画四条等宽色块，显示零用量说明与最低消费。

图形比例用真实分项/真实分母；显示整数百分比采用最大余数法使合计 100%，相同余数按固定系列顺序分配。零费用不强行占宽。折扣、税状态、币种、费率版本均可见或可在说明中查看。

### 5.3 三组预设与金额验算

| 预设 | 摄入 GB/day | 保留天数 | 扫描 TB/month | 席位 | 月付四项 | 月付总额 |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Hobby | 4 | 14 | 2 | 2 | 14.40 + 1.68 + 5.00 + 0.00 | $49.00（用量 $21.08，补差 $27.92） |
| Startup | 80 | 30 | 40 | 12 | 288.00 + 72.00 + 100.00 + 126.00 | $586.00 |
| Scale | 900 | 90 | 400 | 60 | 3240.00 + 2430.00 + 1000.00 + 798.00 | $7,468.00 |

Startup 年付月等效 $498.10，年额 $5,977.20；Scale 年付月等效 $6,347.80，年额 $76,173.60，节省 $13,442.40。视频整美元文本分别约为 6,348 / 76,174 / 13,442；demo 的分项明细保留真实精度，显示规则统一，不能直接存视频四舍五入后的数字。

## 6. 数据与公开 API

领域类型在 block 自有文件声明，以下为契约摘要；完整公开类型见 `packages/blocks/src/application/cost-estimate-01/cost-estimate-types.ts`。

```ts
type CostEstimateBilling = "monthly" | "annual";
interface CostEstimateUsage {
  ingestGBPerDay: number;
  retentionDays: number;
  scannedTBPerMonth: number;
  seats: number;
}
interface CostEstimatePreset { id: string; label: string; usage: CostEstimateUsage }
interface CostEstimateInputs {
  regionId: string;
  billing: CostEstimateBilling;
  ingestGBPerDay: number;
  retentionDays: number;
  scannedTBPerMonth: number;
  seats: number;
}
interface CostEstimateRateCard {
  id: string;
  version: string;
  regionId: string;
  currency: string;
  minorUnitDigits: number;
  billingDays: number;
  compressionRatio: number;
  includedSeats: number;
  annualDiscountBps: number;
  minimumMonthlyMinor: number;
  // ingest/storage/query/seat 四项 micros 单价，十进制整数字符串。
  ratesMicros: Record<"ingest" | "storage" | "queries" | "seats", string>;
}
```

`CostEstimateProps` 采用 **受控输入**：value、onValueChange(next, reason)、rateCard、presets、regions、limits、state、saveState、labels、locale、actions、className。reason 区分 field/preset/reset/region/billing，供宿主记录；不另存一份无法同步的非受控用量。

state 可为 ready/loading/stale/error；saveState 使用区分联合：idle/pending、succeeded + fingerprint、error + message。实施时将错误信息放入 error 状态，避免非法的状态组合。价格卡 regionId 必须等于 value.regionId。loading/error/区域不匹配时不显示旧区域金额，不允许保存；stale 可保留带过期说明的估算，但默认禁用保存，等待宿主刷新。rateCard.version 变更自动重算，不沿用旧折扣后金额。

输出计算结果至少包括：输入快照、费率 ID/版本、四项 amountMinor、usageSubtotalMinor、minimumAdjustmentMinor、monthlyEquivalentMinor、annualTotalMinor、annualSavingsMinor、effectiveCostPerGB、派生存储/摄入量。所有金额/比例由这一结果派生，不在多个视图重复计算。

保存回调 `actions.onSave(snapshot)` 传点击时不可变快照：inputs、rateCard ID/版本、结果、货币口径。宿主同步置 pending，防重复保存；响应只关联该次请求。保存过程中可继续编辑，成功反馈不能将新输入标成已保存；只有当前指纹与保存指纹相同才显示“已保存”。改变区域/输入后清除当前保存标记，服务器任务是否取消由宿主决定。

actions 仅提供可选 onSave / onRetry；onClose / onOpenSettings 及对应 demo 面板已随顶部入口移除。重置使用显式 defaultInputs（初始 Startup）恢复整组输入；应用预设只更新四项用量，保留区域与计费方式。当前数值与某预设四元组完全一致才标记该预设，否则为自定义。

输入示例边界：摄入 0–1000 GB/day、step 0.5；保留 1–365 天、step 1；扫描 0–500 TB/month、step 0.5；席位 0–100、step 1。此范围用于演示，可由 limits 配置。费率与边界必须有限、非负、min < max、step > 0，压缩比/billingDays > 0、优惠 0–10000 bps；数据非法显示说明并阻止计算，不静默补零。

## 7. 交互、错误与可访问性

1. 拖动实时调用 onValueChange，本地计算不请求网络；滑动过程中不每帧发 Toast 或 live region。精确 Input 在输入阶段保留 draft，blur/Enter 校验、归一到 step 后提交，Escape 恢复；非法值显示 FieldError，不把空输入当零。
2. 预设/重置一次提交完整对象，金额和所有行同步改变。自定义状态没有误选预设；重置即使数值相同也不会产生无意义请求。
3. 区域由宿主设置并提供匹配的 rateCard；异步查询使用请求序号/AbortController，旧响应不能覆盖新区域。演示默认使用 us-east，另导出 eu-demo 示例价表供宿主适配，币种同为 USD；block 内没有区域切换界面，不把示例价格声称为真实价格。
4. 月付/年付只改 billing，按原始数量和原始单价重新计算，避免重复应用优惠。最低消费下有效节省可能小于 15%，显示实际节省，徽标写“用量单价优惠 15%”。
5. 保存不存在回调则隐藏，非法输入/无价表/请求中禁用；失败保留输入和结果，可重试。文档 demo 将真实 JSON 写入下载文件，标记 demonstration=true；显示“保存示例估算”，不只弹成功提示。
6. Header 仅保留标题和现有说明 Tooltip，不保留区域 Select、设置、关闭或更多菜单；demo 对应的计价 Dialog 与关闭/重开状态已移除。
7. 每个 Slider 和 Input 有独立稳定 label/id，单位与换算说明可读；图表旁四项金额和百分比是同等数据入口。金额更新不会抢焦点；保存/失败/预设应用使用简短状态反馈。无颜色依赖。
8. 组件默认动效保留，尊重 prefers-reduced-motion；不新增数字跳动、轨道手写动画或逐段图表动画。实现时实测所选 Slider 的减少动态效果行为，未满足时优先选已有可用公共能力，不以静态 lint 代替运行验证。

## 8. 文件与分发接入

建议新增：

```text
packages/blocks/src/application/cost-estimate-01/
  index.ts
  cost-estimate.tsx             # Container、受控输入与动作编排
  cost-estimate-types.ts        # 公开数据/状态/结果/回调
  cost-estimate-data.ts         # 校验、计算、预设匹配、格式化
  cost-estimate-summary.tsx     # 金额、年付/最低消费、Chart 构成
  cost-estimate-usage.tsx       # 四行 Slider/Input
  cost-estimate-demo-data.ts    # 固定价表、边界与三组预设
docs/components/blocks/CostEstimateDemo.tsx
docs/pages/blocks/cost-estimate-01/{page,CostEstimateBlockDocClient}.tsx
docs/content/{zh-CN,en}/blocks/cost-estimate-01.json
docs/agent-guides/blocks/cost-estimate-01.md
tests/cost-estimate-data.test.ts
tests/cost-estimate-interaction.test.tsx
```

需要登记的已有入口：

- `packages/blocks/package.json`、`src/catalog.ts`、`block-capabilities.json`、`registry.json`：公开导出/分类/安装边界，catalog 与 Registry 依赖必须一致。
- `docs/manifest.ts`、`docs/catalog/artifacts.ts`、独立 demo 列表、StandaloneBlockDemo、BlockPreview：发现、文档、独立预览。
- `scripts/preview-source-allowlist.mjs`：准确列入全部可复制业务文件。
- 文档 page loader/content loader 的导入映射：当前这些带 generated 名称的文件作为生成器输入维护，按现有约定登记，再生成路由；不要凭命名假设存在导入生成命令。
- `docs/agent-data/item-identities.json`、guide-routes 与 guide loader/catalog：静态发现资料。
- `scripts/test-consumer-installs.mjs`：将新 block 加入 Next/Vite 可选择测试集合，Next 交互入口明确为 client。

直接 Registry 依赖预期为 container、button、select、radio-group、slider、input、field、badge、chart、tooltip、empty、inline-notice、skeleton、icon-context、utils；npm 依赖 recharts。Dialog、ToastStack 只在 demo 使用时不要误加入核心依赖。实际清单以最终 import 为准；surface-context 等间接依赖由现有组件 Registry 闭包安装。

路由、复制源码、public/r、guide loader、llms 资料通过现有脚本生成。保留其他工作区改动，不用整库重置处理生成差异。本次仅新增方案文件，不执行上述注册或发布。

## 9. 实施顺序与估算

| 阶段 | 产出与完成条件 | 单人估算 |
| --- | --- | --- |
| 1. 数据和计算 | 纯函数、整数金额、预设、边界与基准用例；先锁定 586/7468/49 和年付结果 | 0.5–1 天 |
| 2. Container 静态组合 | Header/两个 Body/Footer、统一标题、金额/构成/四行输入；双主题初验 | 0.5–1 天 |
| 3. 交互与 demo | 预设/重置、周期/区域、保存真实示例文件、说明/关闭、失败与过期 | 0.5–1 天 |
| 4. 分发与验收 | 双语文档/guide、Registry/源码、Next/Vite 安装、窄屏/键盘/动效复查 | 0.5–1 天 |

原方案估算首版约 **2–4 个工作日**，不代表实际投入工期。后续追加的 Slider 刻度和富内容 Tooltip 已实施，完成范围与验证结果见第 12 节；真实计费服务、税费与阶梯费率仍由宿主接入。

## 10. 验收与检查命令

### 10.1 必须通过的用例

- Startup 月付 586.00；Scale 月付 7468.00；Hobby 用量 21.08 + 最低消费补差 27.92 = 49.00。
- Scale 年付月等效 6347.80、年额 76173.60、节省 13442.40；月→年→月恢复同一基线，没有多次折扣。
- 总额等于已舍入分项加补差；整数百分比合计 100%；全零条不除零、不造占比；GB/TB/天/席位口径一致。
- 0 摄入、免费席位以内、优惠 0%/100%、最低消费上下边界、无价表/非法费率/超大输入均有确定行为。
- 四项输入、预设、自定义和重置状态一致；键盘、触摸、直接输入及取消编辑正常。
- 区域连续切换不会呈现旧价表；过期/失败不冒充有效报价；保存绑定点击时版本与输入。
- 保存双击一次、失败重试可用；请求中编辑后旧保存成功不将新输入标记为已保存；下载金额与界面一致。
- Container DOM 和两个 ContainerBody 正确，标题计算字号/字重为 14px/500；没有另外的手写外框或 section surface。
- 320/375/576/768px 容器、短视口、长标签、大金额、浅深色、200% 缩放、减少动态效果和同页双实例检查；图表、Select/Tooltip 不裁切，无整体横向溢出。

### 10.2 实施时运行

以下命令用于重复验证。实际执行范围及结果记录在第 12 节；未执行的命令不作为通过证据。

```sh
pnpm exec vitest run --config vitest.config.mts tests/cost-estimate-data.test.ts tests/cost-estimate-interaction.test.tsx
pnpm typecheck
pnpm exec eslint --config eslint.design.config.mjs packages/blocks/src/application/cost-estimate-01
pnpm lint:design

pnpm registry:build
pnpm docs:routes:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm agents:build

pnpm tokens:check
pnpm registry:check
pnpm docs:routes:check
pnpm docs:sources:check
pnpm agents:guides:check
pnpm agents:check
pnpm exec vitest run --config vitest.config.mts tests/block-standalone-demo-contract.test.ts tests/block-preview-visibility.test.tsx tests/i18n-document-manifest.test.ts tests/i18n-message-parity.test.ts

ZERON_CONSUMER_COMPONENTS=cost-estimate-01 \
ZERON_VITE_CONSUMER_COMPONENTS=cost-estimate-01 \
ZERON_CONSUMER_PACKAGE_MANAGERS=pnpm pnpm test:consumer:smoke
pnpm build
```

消费者脚本须先完成第 8 节的新用例接入。默认矩阵通过但未实际安装新 block 不算验收。生成后分别记录组件/样式报告、计算/交互结果、独立安装、浏览器和构建证据；既有无关失败保留归属，不重设基线。

## 11. 本地核对依据与待接入事项

实际核对源码：Container、Slider/SliderComfortable、RadioGroup/RadioItem、Select、Input、Field、Button、Tooltip、Chart、badge-colors；以及当前 catalog、CreditUsage 类型/guide、StorageUsage 实现、SecurityOverview 的 Container 修订、预览源码 allowlist 和包导出。规划方法沿用仓库 zeron-page-builder 的选型、布局归属、图表和验证约定。

真实产品接入前需要宿主提供：区域与费率版本、计费周期规则、压缩估计依据、最低消费和优惠资格、税状态、保存权限与接口。演示阶段采用本文固定规则；缺少生产资料不妨碍完成可交互 block，但不能宣称正式报价能力完成。

最终交付标准：结构符合前面 Container 要求；金额可复算；可见操作有实际结果；可发现、可预览、可复制、可安装；公开类型与文档一致；未完成的生产边界明确。

## 12. 首次交付与验收记录（顶部/Tabs 修订前）

验收日期：2026-10-05。开发预览：<http://localhost:3000/zh-CN/block-demo/cost-estimate-01>；Slider 示例：<http://localhost:3000/zh-CN/docs/components/slider>。

### 12.1 已交付

- 可安装 `cost-estimate-01` block；外框使用 Container，汇总、用量分别直接使用 ContainerBody，顶部标题沿用 14px / 500。
- 四项用量、预设、重置、月付/年付、区域切换、金额与费用构成联动；计算器保留货币精度、最低消费、年付优惠和保存指纹。
- Slider 增加 `variant="ticks"`、`tickCount`、`renderTooltip`，实现长短刻度、分类色填充、胶囊手柄、拖动与按压反馈，以及带派生量的提示。刻度数量与输入步长独立；减少动态效果时停止位置弹簧和刻度/手柄缩放。
- 提示复用公共 Tooltip 的 Portal、碰撞避让与描述关系，修复受控打开的锚点绑定；月付/年付 RadioGroup 修复减少动态效果偏好造成的 SSR hydration 差异。
- demo 包含计价说明、关闭/重新打开、费率状态、保存失败重试与下载点击时 JSON 快照；公开类型、双语文档、guide、catalog、预览源码、包导出和 Registry 已登记。

### 12.2 验证结果

| 范围 | 结果与证据 |
| --- | --- |
| 计算、交互、Slider、RadioGroup、文档契约 | 10 个测试文件，43 项通过；包括小数步长、刻度上限、范围模式、受控 Tooltip、SSR、两实例独立性与旧保存快照。日志见 `.zeron/reports/cost-estimate/evidence/tests.log`。 |
| 类型与构建 | `pnpm typecheck` 和 `pnpm build` 通过；受影响代码的常规 ESLint 通过。不是全仓库 lint 结论。 |
| 独立消费者 | 明确选择 `cost-estimate-01` 的 pnpm / Next.js 和 Vite 安装、编译与样式验证通过，不仅检查工作区导入。 |
| 注册与文档 | Registry、文档路由、预览源码、guide loader 与 agent catalog 检查通过；生成物已更新。 |
| 实际浏览器交互 | 预设、计费切换、区域异步切换、无效输入、取消编辑、保存后继续编辑、失败重试和 JSON 下载已检查；下载金额对应点击时输入。 |
| Slider 拖动与提示 | 普通动效和减少动态效果均检查：连续拖动实时更新，提示与手柄中心对齐，离开后关闭；键盘描述关系可解析。模拟触摸移动至 500 GB/天，提示显示月摄入 15,000 GB，未越出 375px 视口。 |
| 布局与主题 | 检查 320/375/576/768/1280px 视口、浅深色及 CSS 200% 缩放；布局稳定后无整体横向溢出，始终保留两个 ContainerBody。普通动效页面重新加载未捕获 hydration / 页面错误。 |

静态报告按文件范围分别保留：block 自有 12 个文件共 47 种组件导出、79 次 JSX 使用，其中 UI 为 31 种 / 49 次；设计检查覆盖 12/12，0 错误、0 警告。Slider 扩展及相关示例的 3 个文件另有前后基线，0 条新增诊断。完整来源、使用位置与规则覆盖见 `.zeron/reports/cost-estimate/block.json`、`slider-after.json`、`tooltip-after.json`、`radio-after.json`；受影响共享文件汇总见 `after.json`，该汇总统计整份共享文件，不能当作本任务新增组件数量。

人工核对复用项：Container 拥有外层与两个 Body；Field/Input 提供精确输入；Slider/Tooltip 提供用量调节和提示；RadioGroup/Select 提供计费方式与区域选择；Chart/Recharts 提供比例条，金额与百分比同时以文本呈现。没有另建 Slider 拖动引擎，也没有通过业务层选择内部节点来修改公共组件样式。刻度几何属于此次授权的公共组件扩展；分类颜色复用 badgeColors，界面其他颜色沿用语义变量。

### 12.3 明确的边界

费率、可选范围和单位换算使用本方案的确定性示例规则；视频没有给出完整范围与生产价表，不反推未展示的真实计费口径。真实计费与持久化接口尚未接入，示例下载明确标记 demonstration 和未含税。

触摸证据来自浏览器设备模拟，200% 证据来自 CSS 缩放；尚未做物理触屏、系统浏览器缩放、帧率基准和极长自定义标签/极大金额的专项视觉检查。双实例独立性由组件测试覆盖，未另做同页双实例浏览器截图。设计报告中未启用的覆盖、原始色、任意值、未知类名、内联样式、动态类名检查不记为自动通过；本次公共 API、变量语义和关键布局已人工及浏览器核对。新建文件没有可比的实施前基线，不推断历史诊断归属。

## 13. 顶部与计费 Tabs 修订（2026-10-06）

根据后续要求，顶部右侧区域 Select、设置和关闭按钮已移除；同时移除 onClose / onOpenSettings 回调、对应标签以及 demo 的计价 Dialog、关闭/重开状态。Header 仅保留标题和说明 Tooltip。区域仍由宿主提供，用于匹配价表与 Footer 说明，不再由 block 内的控件选择；demo 下方的费率状态 Select 是测试状态入口，不属于 Header。

月付/年付改用公开 Tabs、TabsList、TabItem、TabPanel，显式设置 variant="pill"、color="default"。TabsList 使用 ml-auto 在汇总行靠右，换行时也保持右对齐。每个 Tab 对应实际 Panel，承载该周期的优惠及费用构成；金额仍由同一份受控输入与计算结果更新。没有重写 Tabs 内部样式。

当前实现与第 12 节首次交付不同，以本节及第 4、6、7 节更新后的契约为准。Registry 移除该 block 的 radio-group / select 直接依赖并新增 tabs，双语文档、guide、预览源码及 agent catalog 已同步生成。

本次验证：

- 计算、交互和翻译对齐共 3 个测试文件、17 项通过；常规 ESLint 与类型检查通过。
- 6 个受影响代码文件的设计报告识别 33 种组件导出、57 次 JSX 使用；覆盖 6/6，0 错误、0 警告，与变更前基线比较无新增诊断。范围包括真实 Tabs 与 demo 状态控件，不代表挂载实例数量。
- 浏览器验证 Startup 年付 498.10、Scale 年付 6347.80、Scale 月付 7468.00，重置恢复月付；键盘右方向键切换、aria-selected 和 Panel 描述关系正常。
- 320/375/768/1280px 视口均验证 Tabs 向右对齐、无横向溢出；Header 无区域 Select，仅有左侧说明按钮；浏览器未捕获页面或控制台错误。图表尺寸稳定后截图确认比例条覆盖完整宽度。
- Registry、预览源码与 agent catalog 检查通过；新依赖在独立 pnpm / Next.js 和 Vite 安装与编译矩阵中通过。本次未重复全仓库生产构建或全仓库 lint，不沿用首次记录作为当前版本的全仓库通过证据。

证据位于 `.zeron/reports/cost-estimate/header-tabs-evidence/`；组件来源、使用位置、规则与基线比较见 `header-tabs-after.json`，浏览器及验证摘要见 `header-tabs-verification.json`。桌面和移动截图位于 `output/playwright/cost-estimate-header-tabs-desktop.png`、`cost-estimate-header-tabs-mobile.png`。公开 API、布局归属及语义颜色已人工核对；自动报告中未启用的样式检查仍属于未覆盖，不因报告零诊断宣称通过。

## 14. 费用构成明细布局修订（2026-10-06）

“用量费用构成”下的四项明细固定采用两列、两行，不再在宽屏切为四列。每项 badge 在左侧，价格与占比在右侧水平排列；窄屏减少行内间距、采用 text-label，宽屏价格恢复 text-body，有限宽度内金额和占比可换行。保留原生 dl / dt / dd 关系及公开 Badge，未修改 Badge 内部样式。

浏览器已核对 320/375/1280px 下的 2×2、badge 与价格左右关系及无横向溢出；375px 的 Startup 四项价格均完整单行显示。月付/年付切换仍重新计算并保留四项明细。极小宽度、超长标签或大金额可换行，不承诺所有自定义内容始终单行。

本次仅修改布局类，没有新增行为测试或重复全仓库构建。受影响文件常规 ESLint、设计检查通过；1 文件识别 10 种组件导出、12 次 JSX 使用，0 错误/警告。Registry 和预览源码已重新生成；guide 与 agent catalog 已同步。当前检查及基线比较见 `.zeron/reports/cost-estimate/breakdown-after.json`，浏览器与规则覆盖说明见 `breakdown-verification.json`；截图位于 `output/playwright/cost-estimate-breakdown-{desktop,mobile}.png`。

cost-estimate-01 及完整依赖闭包的 Registry 检查通过。全量 Registry 检查目前有 5 条缺失依赖诊断，归属同时修改中的 cluster-environment-list-01 / monitoring-alert-list-01，与本次布局修订无关；未据此修改其他 block，也不宣称全量检查通过。日志保留在 breakdown-evidence/registry-check.log 与 target-registry.log。

## 15. 四项名称恢复英文（2026-10-06）

按用户要求，将默认类别名称恢复为 Ingest / Storage / Queries / Seats。费用构成 Badge 与用量 FieldLabel 使用同一套 labels，名称同步更新；其余默认文案及单位保留原配置，宿主仍可通过 labels 覆盖。交互测试查询名称已同步更新，Registry、预览源码及 guide / agent catalog 同步生成。该修订只涉及文案，不改动费用计算或布局。

对应检查与组件来源报告见 `.zeron/reports/cost-estimate/english-labels-after.json`；当前范围仅文案源文件及已有交互测试，不代表全仓库验证。
