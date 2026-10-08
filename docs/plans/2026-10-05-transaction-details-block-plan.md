# 交易详情 Block 实施方案

日期：2026-10-05\
状态：已实现；本地验证记录见第 9 节。\
目标：结合用户提供的交易详情截图与当前 Zeron 源码，新增 `transaction-details-01`，公开组件命名 `TransactionDetails`。

## 1. 形态与范围

做成 React `data-block`，用于交易列表旁的详情区、独立详情卡片或宿主弹层内。Block 自身不绑定路由、Dialog、Drawer 或 AppShell；宿主负责打开、关闭、查询数据和真实下载/分享服务。

保留截图的五层内容顺序：

1. 顶部：交易详情标题；下载、分享、更多、关闭操作。
2. 金额：小标签，突出整数金额，小数部分降低强调。
3. 交易字段：发票号、交易类型、状态、付款人、邮箱、付款账户、日期与时区。
4. 账单信息：带圆角与描边的内嵌区域，默认展开；街道、城市、州/省、邮编、邮箱、电话。展开背景由 Accordion 提供。
5. 附件：文件类型标记、名称、大小、更多操作；支持多附件。

截图外部的斜线背景、对齐辅助线、作者署名属于展示画布，预览使用仓库现有背景。金额与时间是演示内容，不推断真实付款状态，也不新增退款、审批或支付流程。

默认最大宽度建议 `max-w-md`（448px），宽度随宿主收缩；与库中 14px 正文匹配。高度随内容增长，暂不固定整卡高度。需要受限滚动时，由宿主确定高度边界并使用 ContainerBody 的 `maxHeight`，避免内外重复滚动。

## 2. 组件选型与局部组合

当前 catalog 没有交易/付款详情专用 block。通用 resource-detail-page 拥有工作区导航、页头和 Tabs，与截图中的嵌入式详情卡片不匹配；新增领域组合，不扩展为另一套通用详情框架。

| 区域 | 采用 | 组合方式与取舍 |
| --- | --- | --- |
| 整体外框 | Container、ContainerHeader、ContainerBody | Container 提供 raised 外层与 floating 内容层；一个 Body 包含金额到附件，不手动重建双层卡片 |
| 顶部操作 | Button、Tooltip | `variant="ghost"`、`iconOnly`、统一 `size="sm"`；可读名称与提示完整 |
| 更多操作 | DropdownMenu、DropdownTrigger、DropdownContent、MenuItem | 菜单内容与能力明确；不留下空菜单或无响应操作 |
| 金额 | 业务文本组合 | 金额不是独立 MetricCard；按格式化结果拆分整数和小数，使用 tabular-nums |
| 交易/账单字段 | DetailList、DetailListItem、DetailListLabel、DetailListValue | 两个字段区均复用详情列表及其子组件；通过公开 className 调整外框、列布局和文字对齐，图标放入 Label。交易字段与数据映射保留在 block 内，不另建通用字段列表 |
| 已批准状态 | Badge `status="success"` | 在 children 中组合 check 图标与文案；其他业务状态映射到语义色，不直接指定绿色值 |
| 付款人 | Avatar、AvatarImage、AvatarFallback | 头像缺失显示姓名首字母；外层无边框、无 padding，保留头像与姓名间距 |
| 付款人邮箱、账户、时区 | 业务文本与静态胶囊 | 邮箱为无边框、无 padding 的可换行文本；账户和时区保留描边胶囊，不使用状态 Badge 冒充普通标签 |
| 账单折叠 | Accordion、AccordionItem、AccordionTrigger、AccordionContent | 单项、默认展开，外部 section 使用 `rounded-xl border-hairline border-border`，无额外背景或 padding；复用键盘和折叠行为 |
| 附件行 | InfoItemGroup、InfoItem 及其内容/尾部组合 | 一行文件信息配独立操作菜单；使用文件图标加 PDF 标签，不使用要求 `File` 且启动 PDF 渲染的 FileThumbnail |
| 数据与反馈 | Skeleton、Empty、ErrorState、InlineNotice | 初次加载、空结果、失败与操作失败分别呈现；有数据的后台刷新保留内容 |

保留组件自身样式与交互，不通过内部 data-slot 选择器重写。Accordion 现有箭头为向右/向下；接受库的箭头行为，与图片展开时的向上箭头有小幅差异。

DetailList 的默认边框与右对齐不是排除它的理由：源码已公开 className，详情列表的职责与本场景一致。具体组合约定如下：

- 主交易详情与账单详情分别使用一个 DetailList，保留现有 list/listitem 语义。外层已由 ContainerBody 或账单 section 承担边界，列表通过公开 className 去掉重复边框、圆角与 padding；主区保留 floating 承载面，账单区继承当前 Accordion 的承载面。
- DetailListItem 使用两列 grid；宽容器统一标签列宽，值列 `minmax(0,1fr)`，窄容器切换上下排列。布局按容器宽度响应，不根据浏览器宽度猜测可用空间。
- DetailListLabel 承载图标与文字，统一图标占位；通过公开 className 使用 `text-fg-muted font-normal`，主字段与账单字段保持同一列对齐。
- DetailListValue 通过公开 className 使用 `ml-0 max-w-none text-left text-fg-default`，解除默认靠右和 70% 宽度限制；保留文字换行，内部胶囊不撑破列宽。
- 不修改 DetailList 原语，不通过内部选择器覆写，也不把 block 的交易类型、状态枚举、字段 schema 加入组件库。局部字段行可以封装这四个组件，统一两个区的调用。

图标优先走当前 `useIcon` 系统。已确认 hash、user、mail、calendar、circle、check、file-text、ellipsis、x 等键存在；分享、账户、交易类型所需专用图标不在当前 IconName 中，实施时从已有图标包核对导出，在 block 内提供领域图标，不冒用不存在的 `useIcon` 键或为单个 block 扩展全局图标枚举。银行卡品牌由数据提供可选 logo，默认用账户图标与品牌文字，避免用两块硬编码颜色模拟 Mastercard。

## 3. 样式变量与视觉差异

| 视觉角色 | 当前变量/工具类 |
| --- | --- |
| 外框 | Container 的 `bg-surface-raised`；账单 section 不额外添加背景 |
| 主内容 | ContainerBody 的 `bg-surface-floating` |
| 主文字/字段值 | `text-fg-default` |
| 字段标签/图标 | `text-fg-muted` |
| 次要金额小数/文件大小 | `text-fg-subtle` |
| 卡片与字段标题 | `text-body font-medium`，沿用近期嵌入式 block 的紧凑标题约定 |
| 正文/辅助标签 | `text-body` / `text-label` |
| 分隔与描边 | `border-hairline border-border` / `border-border-subtle` |
| 间距 | Tailwind 原生 `gap/p/m`，内部大区块建议 gap-5，字段行 gap-3；不存在 `--space-*` |
| 圆角 | Container 默认 3xl/2xl；账单 xl，静态胶囊 full；使用宿主 radius，不写像素圆角 |
| 阴影 | 首版沿用 Container 默认；单独展示若需边缘分离再使用 `shadow-raised`，不复制图片的大范围投影 |
| 交互与动画 | 控件自身动效；新增 CSS 过渡使用语义 duration，检查 reduced motion |

**金额字号是唯一建议补齐的设计变量。** 当前最大语义字号为 `text-heading`（24px/32px），截图的大金额需要更高一级。建议在 token 唯一源增加 `display`（初始 40px/48px，供突出金额/关键数值使用），由生成链提供 `text-display`；不改现有 heading，也不只为该文件添加任意字号 lint 豁免。小数沿用 `text-title` 并基线对齐。

这是方案中的共享 token 改动，实施时需核对生成器和消费者安装结果；窄容器可降至现有 `text-heading`。如果实施范围限定为零新增 token，则金额使用现有 heading，接受与截图相比视觉强调降低的差异。默认方案采用 display，保留截图的主要视觉特征。

## 4. 数据与公开接口

接口以下列责任划分为准；具体 TypeScript 类型在实施阶段固定，不预先建立泛用字段 schema。

| 接口 | 建议契约 |
| --- | --- |
| `transactionId`、`data` | 数据包含同一稳定 ID、发票号、交易类型、金额、状态、付款人、账户、发生时间、账单、附件 |
| 金额 | `amountMinor` 为安全整数，`currency` 为币种代码；按币种精度和 locale 格式化，`formatToParts` 拆分整数/小数，避免用字符串切分破坏分组或币种位置 |
| 付款账户 | 品牌名、可选品牌图、`last4`；API 不要求完整卡号；缺失字段显示“—”，不把未知写成 0 |
| 时间 | 可解析的 ISO 时间戳；`timeZone` 明确指定 IANA 时区，时区标签从同一次格式化获得，不能把全年固定写成 EST |
| 账单与附件 | 账单可缺省；附件为带稳定 ID、文件名、MIME、字节数的列表，下载/打开能力由宿主提供 |
| `state`、`statusMessage` | 首次 loading/error/empty、ready、refreshing/stale；刷新保留同一交易快照，首次失败不能冒充无交易 |
| `locale`、`labels` | 金额、日期、字节数遵从 locale；中英文文案可覆盖。交易类型和状态分别有业务枚举与显示文案 |
| 折叠控制 | `billingOpen`、`defaultBillingOpen=true`、`onBillingOpenChange`，映射至 Accordion 的公开 value/defaultValue/onValueChange |
| `actions` | 下载收据、分享、关闭、打开附件、下载附件、重试；数据动作 payload 包含点击时的 transactionId/attachmentId |
| 异步动作 | 接受 `void \| Promise<void>`；各动作有独立 pending、防重复与错误，不用一个 loading 锁住所有操作 |
| `className` | 供宿主决定宽度、外部布局；不要求宿主覆盖内部控件样式 |

批准→success，待处理→warning，失败→danger，取消→neutral。状态有文字/图标，不能仅凭颜色表达。未知值显示明确未知文案。

切换交易时重置局部动作反馈与非受控折叠状态；旧交易的异步结果不得覆盖新交易。Block 不自行获取数据；宿主负责请求归属与更新，Block 校验可见 transactionId 与 data.id 一致。

## 5. 交互与响应式

- 没有下载/分享/关闭能力时隐藏相应按钮，分隔线随关闭按钮一起出现；顶部更多首版提供实际可用的“复制交易编号/发票号”，不新增删除、退款菜单。
- 附件有打开能力时，文件名为独立语义按钮或链接；右侧菜单提供已接入的打开/下载动作，不使用整行 button 嵌套菜单按钮。
- 复制成功与失败有可读反馈。下载、分享失败允许再次操作，关闭通知宿主，不隐含取消已发出的服务请求。
- 账单缺失隐藏折叠区；部分字段缺失显示“—”。无附件显示简短空态；长文件名可截断但需完整名称查看途径。
- 使用容器响应式：宽容器保留标签/值两列，窄容器字段上下排列；邮件和地址换行，值列 `min-w-0`。页头允许换行，日期与时区胶囊允许换行，不裁掉关键内容。
- Tooltip、Dropdown 使用已有弹层机制；实施时检查 ContainerBody 的 overflow 场景下菜单与焦点可达。
- 首版不做金额计数动画，不展示虚假的中间金额；折叠动画复用现有 Accordion，并单独验证减少动态效果。

## 6. 文件与分发接入

```text
packages/blocks/src/application/transaction-details-01/
  index.ts
  transaction-details.tsx
  transaction-details-types.ts
  transaction-details-format.ts
  transaction-details-labels.ts
  transaction-details-demo-data.ts
docs/components/blocks/TransactionDetailsDemo.tsx
docs/pages/blocks/transaction-details-01/
docs/content/{zh-CN,en}/blocks/transaction-details-01.json
docs/agent-guides/blocks/transaction-details-01.md
tests/transaction-details-format.test.ts
tests/transaction-details-interaction.test.tsx
```

只有实际复杂度需要时再拆字段/附件子文件。模拟请求、示例分享、示例文件与下载实现放在 demo 层。演示交易沿用截图数据；英文示例使用 en-US 与 America/New_York，以同一 UTC 时间生成 15 Dec 2025, 3:32 PM EST；中文入口提供对应中文标签。演示下载必须生成与文件名相符的有效文件，不能把文本改扩展名假装 PDF。

需登记包导出、block catalog、data-block capability、Registry 文件/依赖闭包、manifest 与搜索分类、文档加载映射、BlockPreview、standalone demo、预览源码白名单、agent guide，以及明确选择本 block 的 Next/Vite 消费者样例。分类沿用现有 application/details，不自行创建未经验证的分类或关联产品。

若采用 display，同步改 token 唯一源并运行 tokens 生成；生成产物通过脚本更新，不直接改最终 CSS/public Registry。保持现有工作区中其他任务的改动。

## 7. 实施顺序与验收

1. 固定数据、文案和金额/日期/附件格式化契约；补齐 display 并核对生成结果。
2. 搭建 Container 与基于 DetailList 的两组静态字段，完成默认账单/附件布局和窄容器适配。
3. 接入折叠、复制、下载/分享/附件 callbacks、操作反馈与数据状态。
4. 完成双语文档、可用 demo、独立预览、Registry/agent/消费者安装。
5. 运行定向行为测试、类型检查、设计 lint、生成一致性与消费者验证；进行截图对照和键盘检查。

验收重点：

- 金额精度、币种位置、负数、零值、非法/超大值；不同 locale；整数与小数读作完整金额。
- 冬夏令时、非法日期、长邮箱/地址/文件名；未知附件大小不能显示 0 KB。
- 账单受控/非受控折叠与键盘路径；复制失败、动作失败重试、同动作重复点击、交易切换时过期反馈。
- 首次加载/失败、确认无数据、后台刷新保留快照；没有能力的入口不出现。
- 320/375/448/768px 容器，宽浏览器中的窄侧栏；浅色/深色、键盘、200% 缩放、reduced motion；无整体横向溢出，菜单不被裁切。
- 新 block 可发现、独立预览、复制/安装；Next 与 Vite 实际安装/构建，本仓库编译成功不替代消费者验证。

实施期使用当前仓库实际脚本：定向 Vitest 与 ESLint、`pnpm typecheck`、`pnpm lint:design`；依次生成 tokens/Registry/文档路由/预览源码/guide loaders/agent catalog，再检查一致性。消费者 smoke 显式选择 `transaction-details-01`，最终执行站点构建与浏览器主流程。通过、失败和未检查项分别记录，生成组件/样式使用报告。

预期无需新 UI 原语或新增业务依赖；共享改动以 display token 为限。基础 block、可用 demo、文档分发与验证预计 1–2 个工作日，属方案估算，不包含真实后端和支付服务接入。

## 8. 已核对依据

- `packages/blocks/src/catalog.ts`、`block-capabilities.json`、`registry.json`、`package.json`：block 范围、能力和分发边界。
- `packages/ui/src/components/{container,detail-list,info-item,accordion,badge,avatar,button,dropdown,file-thumbnail,metric-card}.tsx`：真实 props 与默认样式；缺少专门 guide 的组件按源码核对。
- `packages/ui/src/components/badge-colors.ts`、`packages/ui/src/system/icon-context.tsx`：状态语义与实际图标键。
- `SEMANTIC-TOKENS.md`、`packages/ui/src/tokens/semantic-tokens.mjs`、`eslint.design.config.mjs`、`packages/lint/index.mjs`：变量与有效样式规则。
- `docs/components/blocks/standalone-blocks.ts`、现有 security/deployment detail block、近期状态统一方案：预览、Container 与数据反馈约定。

方案阶段只新增此方案文件；随后按用户指示实施，结果如下。

## 9. 实施与验证记录

### 9.1 已交付

- `@zeron/blocks/transaction-details-01` 导出 TransactionDetails、公开类型与确定性示例数据；React data-block，可安装至 Next 和 Vite。
- Container 外框与主体；交易和账单均通过 DetailList 的公开组件组合；账单默认展开，支持受控/非受控；宽容器左右排列，窄容器上下排列。
- 语义金额 `text-display`（40px/48px），窄容器降到 heading；只改 token 唯一源，通过生成链更新主题、token 包与 Tailwind merge 名称。
- 金额保持最小货币单位精度；日期与时区来自同一时间戳，支持冬夏令时；账户只展示后四位，头像/品牌图有回退。
- 复制交易/发票号，下载、分享、关闭与附件 callbacks；同动作同步防重，不阻塞其他动作；每条反馈带动作名称，切换交易不显示旧动作结果。
- loading、empty、error、stale、后台 refreshing 与刷新失败保留旧快照；未知值不写成零。
- 双语文档、独立预览、源码复制、Registry、agent identity/guide/catalog 和消费者安装例子。
- Demo 可模拟八种数据状态和动作失败，可关闭/重开、展示分享摘要、预览/下载真实结构的示例 PDF；PDF 为 347000 字节，与附件展示一致。

本地入口：

- [中文独立预览](http://localhost:3000/zh-CN/block-demo/transaction-details-01)
- [英文独立预览](http://localhost:3000/en/block-demo/transaction-details-01)
- [中文文档](http://localhost:3000/zh-CN/docs/blocks/transaction-details-01)
- [英文文档](http://localhost:3000/en/docs/blocks/transaction-details-01)

### 9.2 验证范围

- 核心测试：12 项，覆盖安全整数/币种精度/负值/缺失值、冬夏令时、有效 PDF 结构与长度、两组 DetailList、受控折叠、操作防重/独立操作、失败重试、交易切换归属、复制失败、附件 ID 与品牌图回退。
- 连同语义 token、预览、独立演示、多语言文档与 Registry 契约，共 7 个文件、84 项测试通过；多语言计数在并行新增文档期间曾短暂不一致，后续现有文档登记完成后复查通过，未为该 block 修改测试基线。
- 本 block、demo 的独立严格类型检查和定向 ESLint 通过；工作区类型检查、全库设计 lint 通过。并行改动曾造成生成类型文件和图表文档错误，未修改其他任务的业务源码来绕过检查。
- Registry、token、文档路由、预览源码、agent guide/catalog 生成一致性全部通过。
- Next/pnpm 与 Vite 的独立安装、类型检查、生产构建通过。显式设置两个消费者集合为 transaction-details-01，未宣称所有组件/所有包管理器矩阵通过。
- 浏览器验证：复制发票号、下载 347000 字节 PDF、分享演示 Dialog、附件菜单和 blob PDF 预览、动作失败、首次失败与重试、刷新失败保留数据、确认空数据、关闭/重开、账单键盘操作均可用。
- 英文与中文入口；320、375、448、768、1280px 无整体横向溢出。浅/深主题已实测，深色主体为语义 floating 表面；窄容器长邮箱/文件名通过 DOM 压力探针检查无主体横向溢出，不等同于真实接口数据验收。reduced motion 环境下键盘折叠可用，未添加自定义金额动画。
- 浏览器下载文件位于 `output/playwright/transaction-demo.pdf`；截图为 `output/playwright/transaction-details-*.png`。

消费者命令：

```sh
ZERON_CONSUMER_COMPONENTS=transaction-details-01 \
ZERON_VITE_CONSUMER_COMPONENTS=transaction-details-01 \
ZERON_CONSUMER_PACKAGE_MANAGERS=pnpm pnpm test:consumer:smoke
```

### 9.3 使用报告与边界

组件报告覆盖 11 个实现/演示/文档/token 源文件：44 种 UI 导出、73 次使用；连同业务/内部/第三方组合，共 62 种组件、110 次代码使用。完整 JSON 与 Markdown 位于 `.zeron/reports/transaction-details/after.json`、`after.md`。

自动来源识别无法解析 DropdownTrigger 的两处重导出；已人工核对 dropdown.tsx 的公开 `const DropdownTrigger = Menu.Trigger`。token 的 mjs 文件不在报告工具的 ESLint 文件范围，报告保持 unchecked；另有 token 一致性检查与全库设计 lint 的独立结果。报告中未启用的自动规则不计为通过。新文件没有迁移前基线，不宣称前后统计改善。

未执行屏幕阅读器、真实服务请求、200% 浏览器缩放、全部 locale/币种和同页多实例的浏览器验收。当前实际服务仍由宿主接入，演示下载文件明确注明不是付款凭证；分享仅展示示例摘要。图库中的头像/银行卡标识与箭头采用库现有样式，不复制截图作者素材或硬编码品牌颜色。

工作区原有及并行改动均保留，未提交或发布。

### 9.4 最终生产构建

最终 `pnpm build` 退出码为 0，编译、类型检查、静态页面生成与构建收尾完成。中途一次构建在收集 trace 时缺少 sitemap 的产物文件；重新构建后通过，没有修改 sitemap 或降低构建检查。

中文文档实际显示“交易详情”标题和 block 预览；账单按钮经真实键盘 Space 操作，aria-expanded 从 true 变为 false。最终英文宽屏截图已更新为当前源码版本。独立验证汇总位于 `.zeron/reports/transaction-details/verification.json`。

### 9.5 后续样式与 Review

2026-10-06 按用户反馈修正 Badge 内容的基线偏移；去掉付款人/邮箱值的边框和 padding；账单外层最终使用 rounded-xl border-hairline border-border，无额外背景或 padding。

本轮 review 修复未知枚举查找、不存在的日期自动顺延，以及 demo 关闭后仍弹窗的竞态，并补充回归测试。最新范围、验证限制、共享前置依赖及分组提交方案见 [Review 与 Commit 计划](./2026-10-06-transaction-details-review-commit-plan.md)。尚未执行提交。
