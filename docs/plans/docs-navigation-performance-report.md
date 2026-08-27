# 文档站顶部导航与页面切换性能分析报告

> 分析日期：2026-08-27
>
> 分析对象：`zeron-ui` 文档站（Next.js 15.5.9 / React 19）
>
> 分析方式：代码审查、现有生产构建产物分析、本地生产服务运行时验证
> 本报告只新增分析文档，不修改现有页面实现。

## 1. 结论摘要

当前“首次进入页面时顶部导航很晚才出现”和“文档顶部导航切换卡顿”不是一个孤立的动画问题，而是以下几类问题叠加的结果：

1. **顶部导航所在的整个 `SiteShell` 被延迟到客户端加载。** 生产 HTML 只包含正文 fallback，不包含顶部导航。用户先看到正文，浏览器下载、解析并 hydration 多个 JS chunk 后，导航才被插入页面。
2. **`SiteShell` 内部使用 `useSearchParams()`，而外层最近的 `Suspense` 恰好包住了整个 Shell。** 对静态路由，这会让该边界内的客户端树回退为客户端渲染，进一步坐实“首屏 HTML 无导航”的现象。
3. **集合路由与详情路由的客户端依赖被严重合并。** 现有生产构建中，`/docs/components`、`/docs/blocks` 和 `/docs/components/button` 都关联同一组约 **3.97 MB 原始 / 1.17 MB gzip** 的脚本。
4. **业务模板集合页一次性导入并挂载全部 26 个交互式 Block。** 实测初始 DOM 约 **10,736 个节点、410 个按钮、541 个 SVG**，页面进入和离开时都会产生高额的 JS 执行、React 挂载/卸载、布局与样式计算成本。
5. **缺少路由级 loading/pending 反馈。** 当前 `app` 目录没有 `loading.tsx`。当路由 payload 或主线程执行较慢时，点击后缺乏即时状态变化，会进一步放大“没响应”和“卡住”的感知。
6. **重路由仍使用默认 Link 预取。** 顶部导航链接一进入视口，生产环境可能自动预取完整静态路由；在当前路由体积下，这可能与 Shell hydration、图标和正文资源竞争。该项是基于框架行为和代码结构的风险判断，建议用 Network 面板再确认实际请求时序。

优先级最高的不是微调动画，而是：**让顶部导航进入服务器输出的初始 HTML，并切断集合页/详情页之间的依赖污染；随后把 Block Gallery 改为静态缩略图或视口内渐进加载。**

## 2. 用户现象与代码链路

### 2.1 首次进入时导航延迟出现

当前链路如下：

```text
LocaleLayout
  -> AppProviders（Client Providers）
    -> SidebarLayout（Client Component）
      -> Suspense
        -> React.lazy(SiteShell)
          -> AppShellHeader
            -> DocsPrimaryNavigation
```

关键代码位于：

- `docs/components/shell/site/sidebar-layout.tsx:7-9`：`SiteShell` 通过 `React.lazy()` 动态导入；
- `docs/components/shell/site/sidebar-layout.tsx:23-24`：fallback 只渲染 `{children}`，没有 Header；
- `docs/components/shell/site/site-shell.tsx:48`：顶部导航内部读取 `useSearchParams()`；
- `docs/components/shell/site/site-shell.tsx:177-190`：顶部导航、侧边栏、正文和右侧栏全部位于同一个客户端 Shell 中。

这会产生两个直接结果：

- 首屏 HTML 中没有顶部导航，导航只能等待客户端 JS；
- fallback 与最终 Shell 的结构不同，Header 后插入，存在内容下移和布局跳变风险。

Next.js 官方说明：静态渲染路由中，Client Component 调用 `useSearchParams()` 会使组件树一直到最近的 `Suspense` 边界改为客户端渲染。当前最近边界正好包住整个 `SiteShell`，边界粒度过大。参见 [Next.js `useSearchParams` 文档](https://nextjs.org/docs/app/api-reference/functions/use-search-params)。

### 2.2 顶部导航切换时卡顿

顶部导航连接的三个主入口分别是业务模板、组件和指南。当前业务模板和组件集合走同一个动态集合路由：

```text
app/[locale]/docs/[collection]/page.tsx
  -> docs/server/render-page.tsx
    -> BlocksGallery（静态导入）
    -> ComponentsGallery（静态导入）
```

与此同时，详情页也从同一个 `render-page.tsx` 导入渲染逻辑。该模块还引入了全量 `pageLoaders`。结果是集合页与详情页的客户端引用被聚合进相同路由构建范围，形成明显的跨路由依赖污染。

另外，`app/[locale]/docs/layout.tsx` 为了判断 pathname 被整体标记为 Client Component，并静态导入 `ComponentsDetailWorkspace`。这使所有文档子路由都需要携带组件工作区相关代码，即使当前页面不是组件详情页。

## 3. 已验证证据

### 3.1 生产 HTML 没有顶部导航

对现有 `.next` 生产构建启动本地服务后直接请求页面，得到以下结果：

| 路由 | HTML 大小 | Script 数 | JS 原始体积 | JS gzip 估算 | 初始 HTML 含 TopNav | 含 Shell fallback |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `/docs` | 32.9 KB | 32 | 1,242.5 KB | 400.5 KB | 否 | 是 |
| `/docs/components` | 24.4 KB | 51 | 3,967.9 KB | 1,174.1 KB | 否 | 是 |
| `/docs/blocks` | 24.4 KB | 51 | 3,967.9 KB | 1,174.1 KB | 否 | 是 |
| `/docs/components/button` | 92.2 KB | 51 | 3,967.9 KB | 1,174.1 KB | 否 | 是 |

这里的 gzip 数值是对构建文件逐个 gzip 的本地估算，用于同版本内对比，不等同于 CDN 的最终 Brotli 传输体积。

生产 HTML 中能找到 `min-h-screen` fallback，但找不到 `data-slot="top-nav"`。这与“正文先出现、导航随后出现”的用户描述完全一致。

### 3.2 Shell 的延迟加载边界过重

`.next/react-loadable-manifest.json` 显示：

- `sidebar-layout.tsx -> site-shell.tsx` 关联 18 个 chunk；
- 这些 chunk 合计约 **426.5 KB 原始 / 145.7 KB gzip**；
- 它们包含 Header 需要的导航能力，也包含 Sidebar、颜色选择器、Tooltip、设置和其他 Shell 交互依赖。

也就是说，为了显示最基础的顶部导航，浏览器需要完成一个明显偏重的客户端依赖链。

### 3.3 运行时复核

本地生产构建、新建浏览器页面的观测结果：

- `/docs` 的页面导航请求约 81 ms 返回时，TopNav 仍不存在；
- 首次会话中，随后等待导航可交互并完成第一次顶部导航操作约 3.27 s；
- 资源缓存后重新进入 `/docs`，TopNav 仍比页面响应晚约 336 ms 出现。

这些数值来自本机生产服务，不代表真实线上 P75；但它们证明了导航出现时间与 HTML 响应时间被人为拆开。低端设备、冷缓存和慢网络下，差距只会更明显。

### 3.4 Business Blocks Gallery 的 DOM 和组件负载过高

`docs/components/blocks/BlockPreview.tsx` 顶部静态导入 26 个 Block，并在 Gallery 中为每个模板直接渲染完整交互页面。生产运行时实测：

| 页面 | DOM 元素 | Button | Input | SVG | 完整预览实例 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/docs/blocks` | 10,736 | 410 | 120 | 541 | 26 |
| `/docs/components` | 1,055 | 7 | 1 | 68 | 0 |

每个 Block 还可能自行注册事件监听、状态、表格模型、ResizeObserver、动画和其他 Effects。因此 `/docs/blocks` 不仅下载重，挂载与卸载也重；从该页面切往其他顶部导航入口时，旧树的清理同样会占用主线程。

### 3.5 路由依赖没有按页面边界隔离

以下几处结构共同扩大了路由构建范围：

- `docs/server/render-page.tsx:9-10` 同时静态导入 `BlocksGallery` 和 `ComponentsGallery`；
- `docs/server/render-page.tsx:6` 引入所有文档页的 `pageLoaders` 映射；
- `app/[locale]/docs/layout.tsx:6` 为全部 docs 路由静态导入 `ComponentsDetailWorkspace`；
- `BlockPreview.tsx:4-28` 静态导入全部业务 Block；
- `app/[locale]/docs/[collection]/page.tsx` 用一个动态段承载不同重量级集合页，生产 manifest 对这些页面取了共同依赖集合。

构建结果也验证了这一点：组件集合、业务模板集合和普通组件详情页最终引用相同的 51 个脚本和相同总脚本体积。

## 4. 根因优先级

| 优先级 | 根因 | 影响 | 置信度 |
| --- | --- | --- | --- |
| P0 | 整个 `SiteShell` 被 `lazy + Suspense` 延迟，fallback 不含 Header | 首次进入导航缺失、Header 后插入、布局跳变 | 已验证 |
| P0 | `useSearchParams` 位于整壳 Suspense 边界内 | 静态页面 Shell 客户端渲染，放大导航延迟 | 代码 + 官方行为 + 产物已验证 |
| P0 | Block Gallery 一次挂载 26 个完整交互页面 | 切入/切出卡顿、长任务、内存和 DOM 激增 | 已验证 |
| P1 | collection/detail 共用渲染模块并静态交叉导入 | 组件、Block、详情路由 JS 被合并 | 产物已验证 |
| P1 | docs layout 为 pathname 分支整体客户端化，并导入组件工作区 | 所有 docs 页面 hydration 与依赖扩大 | 已验证 |
| P1 | 顶部重路由使用默认预取 | 可能在首屏后台预取约 1.17 MB gzip 的静态路由 | 框架行为已确认，请用 Network 再核对时序 |
| P2 | Header 直接包含 ColorPicker、Tooltip、完整 IconProvider 等交互依赖 | 关键导航 chunk 偏重 | 构建依赖已验证 |
| P2 | 没有 `loading.tsx` 或 Link pending 状态 | 点击后缺乏即时反馈，放大卡顿感 | 已验证 |

## 5. 建议改造方案

### 5.1 第一阶段：先让顶部导航稳定地出现在首屏 HTML（P0）

#### A. 移除整个 Shell 的延迟加载

将 `sidebar-layout.tsx` 中的：

```tsx
const SiteShell = lazy(() => import("./site-shell"))

<Suspense fallback={<div className="min-h-screen">{children}</div>}>
  <SiteShell>{children}</SiteShell>
</Suspense>
```

改为直接导入 `SiteShell`。导航属于页面关键骨架，不应作为低优先级功能延迟。

如果短期必须保留 Suspense，fallback 至少要输出固定高度 Header 骨架和稳定的 AppShell 布局，不能只输出正文。不过这只能减少布局跳变，不能解决导航不可交互和 JS 依赖过重。

#### B. 把 `useSearchParams` 缩到语言切换按钮这个最小岛

当前 `useSearchParams()` 只是为了在切换语言时保留 query string，不值得让整个 Shell 进入客户端渲染边界。建议：

1. Header、品牌和三个主导航链接正常 SSR；
2. 单独创建 `LocaleSwitchLink` 客户端组件；
3. 只给 `LocaleSwitchLink` 包一个很小的 Suspense fallback；
4. 或在点击语言切换时读取 `window.location.search`，而不是在 Header render 阶段订阅 `useSearchParams()`。

完成标准：直接 `curl` 生产页面 HTML 时必须能找到 `data-slot="top-nav"` 和三个主导航链接。

#### C. 保持 Shell 跨路由稳定

顶部导航和 AppShell Header 应由共享 layout 持久化，不应在普通 docs 子路由切换时重新 suspense、卸载或重新创建。Header 的 active 状态可以是一个很小的 pathname 客户端岛，Shell 结构本身继续由服务端输出。

### 5.2 第二阶段：切断路由依赖污染（P0/P1）

#### A. 拆分 `render-page.tsx`

建议拆成至少三个模块：

```text
docs/server/doc-detail.tsx
docs/server/components-collection.tsx
docs/server/blocks-collection.tsx
```

详情页模块不得静态导入任意 Gallery；集合页模块不得引入全量 detail page loader。

#### B. 为重量级集合建立显式静态路由

优先使用：

```text
app/[locale]/docs/components/page.tsx
app/[locale]/docs/blocks/page.tsx
app/[locale]/docs/icons/page.tsx
```

不要让 `[collection]/page.tsx` 同时承载重量差异巨大的集合页。显式路由更容易形成独立客户端 chunk，也便于分别设置 loading、prefetch 和缓存策略。

#### C. 把组件详情工作区放进专属 layout

`ComponentsDetailWorkspace` 不应由全局 docs layout 静态导入。应下沉到组件详情专属路由层。普通 `/docs`、`/docs/icons/*` 和 Block 页面不应加载组件 Gallery/Workspace 代码。

#### D. 按集合拆分 page loader registry

将全量 `pageLoaders` 至少拆为：

```text
componentPageLoaders
blockPageLoaders
iconPageLoaders
```

更理想的做法是生成明确的路由入口，避免一个 runtime loader map 成为所有页面的共同依赖中心。

### 5.3 第三阶段：重做 Block Gallery 的预览策略（P0）

首选方案是**静态海报图 + 详情页完整交互**：

- Gallery 卡片只显示预生成的 AVIF/WebP 缩略图；
- 用户点击进入详情页后再加载完整 Block；
- Hover/Focus 可选择性预取目标详情页；
- 对需要“直接体验”的少量精选模板，可只为首屏 1–2 个卡片提供交互预览。

如果必须保留 Gallery 内交互，至少采用：

1. 每个 Block 单独 `dynamic import`，禁止 `BlockPreview.tsx` 静态导入全部 Block；
2. IntersectionObserver 只加载进入视口附近的卡片；
3. 同时挂载的完整 Block 上限建议为 2–4 个；
4. 离开视口较远时卸载，或降级回海报图；
5. 对长列表使用窗口化；`content-visibility: auto` 只能减少布局/绘制，不能替代 JS 拆包和组件延迟挂载。

短期目标应把 `/docs/blocks` 首屏 DOM 从约 10,700 降到 1,500 以下，并消除一次性 26 个完整 Block hydration。

### 5.4 第四阶段：优化顶部导航关键依赖（P1/P2）

在导航已经 SSR 后，再做以下减重：

- Header 首屏只保留品牌、主导航和轻量按钮；
- ColorPicker 的弹层内容在首次打开时加载；
- Tooltip Provider、复杂 Popover 内容不要阻塞导航文本与链接；
- 将文档目录图标与应用级完整 IconProvider 拆分，Shell 只携带实际使用的少量图标；
- Sidebar 可继续客户端交互，但不要与 Header 共用一个“大而全”的延迟 chunk；
- 对 50+ 条侧边栏链接可考虑分段、折叠或仅渲染当前 collection。

### 5.5 第五阶段：补足导航反馈和预取策略（P1）

#### A. 增加稳定的 loading 边界

在各集合/详情路由增加 `loading.tsx`，但只替换正文区域，Header 必须保持不动。建议展示与目标页面结构一致的 skeleton，避免空白闪烁。

同时给顶部 NavItem 增加 pending 状态：

- 点击后立即显示细进度条或 active item pending 指示；
- 禁止重复点击同一路由；
- 保留当前内容直到新内容 ready，或显示正文 skeleton；
- 遵守 `prefers-reduced-motion`。

#### B. 在路由减重前临时限制重页面预取

Next.js 会在生产环境中自动预取进入视口的 `<Link>`；对静态路由，默认可能预取完整路由。参见 [Next.js Link prefetch 文档](https://nextjs.org/docs/app/api-reference/components/link#prefetch)。

在 `/docs/components` 和 `/docs/blocks` 仍然约 1.17 MB gzip 时，可以临时设置 `prefetch={false}`，改为用户 hover/focus 后手动 `router.prefetch()`。这不是最终方案：最终仍应先把路由体积降下来，再恢复合理预取。

## 6. 建议实施顺序

### 第一批：1–2 个工作日

1. 取消 `SiteShell` 整体 lazy；
2. 将 `useSearchParams` 隔离到语言按钮；
3. 让 Header 出现在初始 HTML；
4. 增加 Header 稳定骨架和正文 loading；
5. 临时关闭两个重集合入口的自动预取。

预期收益：直接解决“顶部导航很久才出现”，降低首屏布局跳变，并让点击立即有反馈。

### 第二批：2–4 个工作日

1. 拆分 collection/detail server modules；
2. 建立 components/blocks 显式路由；
3. 将 `ComponentsDetailWorkspace` 下沉到专属 layout；
4. 按集合拆分 loader registry；
5. 重新构建并对比每个 route manifest。

预期收益：普通组件详情不再携带所有 Gallery 和 Block 代码，页面切换下载量与 JS 解析量显著下降。

### 第三批：3–5 个工作日

1. 为 Block Gallery 生成海报图；
2. 移除 26 个 Block 的同步静态导入；
3. 实现视口内渐进加载或精选交互预览；
4. 限制同时挂载的完整预览数量；
5. 对长列表做 DOM/Observer/Effect 审计。

预期收益：业务模板页的进入、滚动、离开和切换不再产生大规模主线程长任务。

### 第四批：持续优化

- 精简 Header 图标、Tooltip、ColorPicker 依赖；
- 调整 Link 预取策略；
- 建立 bundle size 和 DOM size CI 门禁；
- 持续跟踪 Web Vitals 与真实用户 P75。

## 7. 验收指标

建议在生产构建、冷缓存、4× CPU 降速和 Slow 4G 下验收：

| 指标 | 当前基线 | 第一阶段目标 | 完整改造目标 |
| --- | ---: | ---: | ---: |
| 初始 HTML 含 TopNav | 否 | 是 | 是 |
| `/docs` 初始 JS gzip | 约 400.5 KB | < 300 KB | < 250 KB |
| 集合/详情初始 JS gzip | 约 1,174.1 KB | < 700 KB | < 400 KB |
| `/docs/blocks` 首屏 DOM | 约 10,736 | < 3,000 | < 1,500 |
| 首次导航出现时间 | 页面响应后 336 ms（缓存后本机）到数秒（首次会话） | 与首屏 HTML 同时出现 | 与首屏 HTML 同时出现 |
| Warm route click → 内容可见 | 需要补充标准化 Performance 录制 | P75 < 300 ms | P75 < 200 ms |
| Header 相关 CLS | 当前有后插入风险 | 0 | 0 |
| 单次切换主线程 Long Task | 未标准化记录 | 无 > 200 ms | 无 > 100 ms，尽量无 > 50 ms |

## 8. 验证方案

每一批改造完成后执行：

1. `pnpm build && pnpm start`，禁止以 dev 模式结果作为上线结论；
2. 用 `curl` 检查 HTML 是否直接包含 `data-slot="top-nav"`；
3. 统计每个目标路由 HTML 中的 script 数、原始体积和 gzip/Brotli 体积；
4. Chrome Performance 录制冷启动与以下切换：
   - `/docs` → `/docs/components`；
   - `/docs/components` → `/docs/blocks`；
   - `/docs/blocks` → `/guides`；
   - `/docs/components/button` → 下一个组件详情；
5. 检查 Long Tasks、Script Evaluation、Recalculate Style、Layout、React commit；
6. React Profiler 对比 Header、Sidebar、Gallery 的 render/commit 次数；
7. Network 检查 TopNav 三个链接的预取时序及是否下载无关 Block/详情 chunk；
8. 用 Playwright 增加以下回归断言：
   - 首屏 HTML/首次 paint 阶段 Header 存在；
   - 路由切换过程中 Header 不卸载；
   - pending 状态在 100 ms 内出现；
   - Block Gallery 首屏只挂载规定数量的交互预览；
   - reduced motion 下不出现额外等待。

## 9. 不建议作为首要方案的调整

以下措施可以做，但不能解决本轮根因：

- 只缩短导航 CSS transition；
- 只给 Header 加 `memo`；
- 只给数组过滤加 `useMemo`；
- 只把图标尺寸调小；
- 只加一个全屏 spinner；
- 只使用 `content-visibility` 隐藏离屏 Block；
- 只升级 Next.js/React 版本。

当前瓶颈首先是 SSR 边界、路由依赖隔离和一次性挂载规模。微优化应放在这些结构问题之后。

## 10. 最终建议

推荐按以下决策执行：

1. **立即修复 Header SSR：** 取消 Shell 整体 lazy，并缩小 `useSearchParams` 的 Suspense 边界；
2. **随后拆路由依赖：** collection、detail、components、blocks 各自形成独立入口；
3. **重构 Block Gallery：** 默认静态海报，完整交互只在详情页或视口内少量加载；
4. **最后优化体验层：** pending、loading、预取、Header 交互依赖和监控门禁。

这套顺序能先消除最明显的“导航迟到”，再处理页面切换的真实主线程与 bundle 瓶颈，且每一步都可以用构建产物和运行时指标独立验收。

## 11. 实施记录（2026-08-27）

已完成第一、二批的关键修复，并提前完成了 Block Gallery 的渐进加载改造：

1. 移除 `SidebarLayout` 对整个 `SiteShell` 的 `React.lazy` 包装；TopNav 改为随首屏 HTML 输出。
2. 将 `useSearchParams` 收敛到语言切换链接自身的 `Suspense` 边界，避免它使整棵 Shell 回退为客户端渲染。
3. 将 `components`、`blocks`、`icons` 的集合页与详情页拆为独立路由入口；详情页只引入所属 collection 的页面加载表。
4. 将 Block Gallery 的 25 个同步预览改为视口邻近时再动态导入；初始阶段仅输出固定比例的占位骨架，不再同时挂载全部交互式 Block。
5. 顶部导航的主入口关闭自动预取，避免用户尚未点击时提前争抢主线程与网络资源。

### 11.1 生产构建验收

`pnpm build` 已通过。构建过程仍会输出已有的 `slider.s13`、`slider.s14` 与 `sortableCollection.apiReference` 国际化缺失提示；它们不由本次改动引入，且不影响构建成功。

| 生产路由（`zh-CN`） | TopNav 在初始 HTML | 初始脚本 gzip | 改造前基线 | 变化 |
| --- | --- | ---: | ---: | ---: |
| `/docs` | 是 | 426.0 KB | 400.5 KB | Header 已由首屏输出；体积轻微增加是 SSR Header 标记与依赖进入 HTML 的代价 |
| `/docs/components` | 是 | 430.5 KB | 1,174.1 KB | -63% |
| `/docs/blocks` | 是 | 424.3 KB | 1,174.1 KB | -64% |
| `/docs/components/button` | 是 | 879.8 KB | 1,174.1 KB | -25% |
| `/docs/blocks/resource-catalog-01` | 是 | 996.1 KB | 1,174.1 KB | -15% |

以上脚本体积由当前生产服务器返回的初始 HTML 中 `/_next` 脚本逐个 gzip 后求和，便于与本报告第 3 节的同口径基线比较。首要体验结果是：首屏 HTML 已能直接命中 `data-slot="top-nav"`，不再依赖 Shell 懒加载完成后才显示顶部导航。

### 11.2 仍建议继续验证

- 以冷缓存、4× CPU 降速和 Slow 4G 录制实际点击切换，补齐 P75 与 Long Task 数据；
- 为 Block Gallery 增加首屏交互预览数量的端到端断言；
- 处理现有三条国际化缺失项，并在 CI 中加入 bundle / DOM 预算。
