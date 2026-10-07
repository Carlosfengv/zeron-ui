# Zeron Chart 色盘方案

日期：2026-10-06

状态：历史设计建议，未采用；当前实现以 [Chart Token 统一实施记录](./2026-10-07-chart-token-unification-implementation.md) 的五槽位色盘为准。以下源码现状与数值仅记录提案时的基线，供后续协调色盘参考。

建议采用 **6 个常用分类色 + 2 个兼容色 + 现有状态色与中性色**。浅色主题统一提亮并重新协调色相，形成天蓝、杏橙、薰衣草、薄荷绿、玫瑰粉、浅青蓝。分类色表达身份，状态色表达健康或结果；同一色相的浅阶用于面积填充，深阶用于细线和小标记。

配色依据：浅色面积填充的 OKLCH 明度 L 集中到 0.77–0.79，色度 C 为 0.075–0.11。蓝色保持与品牌蓝相近的色相但提高明度；橙色向杏橙调整至 h=65°；青绿向薄荷绿调整至 h=165°；青蓝设为 h=215°，拉开与薄荷绿的距离。线与小标记同色相、同色度，使用 L=0.60 的深阶。深色沿用现有配对。HEX 取整会产生轻微明度与色相偏差。

大面积填充不再沿用深阶统一降饱和的方式，也不把“所有浅色面积色块都与白底达到 3:1”作为选色约束；颜色身份通过标签、图例和同色相深阶标记建立。必须单靠细线、节点或小图形辨识时，应使用深阶。

## 1. 三个模块的现状

| 模块 | 图形 | 当前分类映射 | 值得保留的规则 |
| --- | --- | --- | --- |
| `credit-usage-01` | 容量分段条 | Pixelsz → blue；Opus → orange；GPT → violet；Sonnet → green；Gemini → cyan | 用模型提供的显式颜色；当前和上一周期保持映射；未使用容量由 `--muted` 表达 |
| `cost-estimate-01` | 费用构成堆叠条 | Ingest → orange；Storage → blue；Queries → teal；Seats → purple | 图表、Badge dot 和 Slider 填充复用同一分类映射；成功优惠标签使用独立状态色 |
| `model-router-01` | 路由流图与占比条 | Opus → blue；GPT → teal；Haiku → purple；Qwen → pink | 连线、端点、粒子、表格 dot 和占比条复用 route.color；晕层 8%、基础线 30%、粒子头 90% |

注意：Credit 模型列表当前使用供应商 Logo，并没有与分段条配对的彩色 dot。供应商 Logo 的品牌色与数据分类色具有不同用途，不能据此判断图表系列身份。

源码依据：

- [Credit 示例映射](../../packages/blocks/src/application/credit-usage-01/credit-usage-demo-data.ts)
- [Credit 分段条及模型列表](../../packages/blocks/src/application/credit-usage-01/credit-usage.tsx)
- [Cost 分类映射](../../packages/blocks/src/application/cost-estimate-01/cost-estimate-data.ts)
- [Cost 图表和图例](../../packages/blocks/src/application/cost-estimate-01/cost-estimate-summary.tsx)
- [Cost 用量控件](../../packages/blocks/src/application/cost-estimate-01/cost-estimate-usage.tsx)
- [Router 示例映射](../../packages/blocks/src/application/model-router-01/model-router-demo-data.ts)
- [Router 连线层次](../../packages/blocks/src/application/model-router-01/router-flow.tsx)

三个模块的图形最终都直接使用 `badgeColors` 的固定 dot HEX。Badge 的 strong 变体已有浅深主题配对，但 `badgeColors` 导出的 dot 本身不随主题调整。

共享 `chartCategoricalColors` 当前顺序为 indigo、cyan、violet、orange、teal、pink、blue、amber，与三个模块的显式映射各自独立。`chartSeriesColor(id)` 按稳定 ID 哈希取色，重排不会换色，但有限色盘允许碰撞。

## 2. 推荐常用色盘

默认取色顺序：**blue → orange → violet → teal → pink → cyan**。优先组合天蓝 / 杏橙、薰衣草 / 薄荷绿，让冷暖和色相距离更平衡。后两个用于增加系列；cyan 为最后扩展色，同图已有 blue / teal 时优先选 pink。顺序只用于为新分类分配颜色，不代表固定的业务含义。

| 名称 | 建议填充 Token | 当前 dot 参考值 | 推荐浅色填充 | 推荐深色填充 |
| --- | --- | --- | --- | --- |
| Blue / 天蓝 | `--chart-category-blue` | `#3B82F6` | `#84B7F9` | `#60A5FA` |
| Orange / 杏橙 | `--chart-category-orange` | `#F97316` | `#E9AC70` | `#FB923C` |
| Violet / 薰衣草 | `--chart-category-violet` | `#8B5CF6` | `#B8A8EB` | `#A78BFA` |
| Teal / 薄荷绿 | `--chart-category-teal` | `#14B8A6` | `#82C9AA` | `#2DD4BF` |
| Pink / 玫瑰粉 | `--chart-category-pink` | `#EC4899` | `#E9A3BD` | `#F472B6` |
| Cyan / 浅青蓝 | `--chart-category-cyan` | `#06B6D4` | `#81C7D9` | `#22D3EE` |

浅色值为本次重新协调的 Chart 专用色盘，深色值继续采用 Badge strongDark。这些是建议的新 Chart 值，不是目前 `badgeColors` 的实际返回值。蓝色 Chart 填充 `#84B7F9` 与项目品牌蓝 / 主要操作色 `#0060D2` 分工不同：前者适合数据面积，后者保留界面操作的强调。

兼容色：

| 名称 | 建议填充 Token | 推荐浅色填充 | 推荐深色填充 | 用途 |
| --- | --- | --- | --- | --- |
| Green / 浅绿 | `--chart-category-green` | `#98C598` | `#4ADE80` | 保留 Credit 中 Sonnet 的分类身份；同步提亮，不绑定成功语义 |
| Purple / 兼容紫 | `--chart-category-purple` | `#C7A3E2` | `#C084FC` | 保留 Cost / Router 现有 purple 输入，浅色同步提亮；新分类优先 violet，不在一张图中同时使用两个近似紫色 |

浅色细线、小圆点、节点、散点等关键标记使用以下深阶；深色对应 Token 复用上表的深色值：

| 分类 | 建议 Token | 浅色主题深阶 | 面积填充的 OKLCH L / C / h |
| --- | --- | --- | --- |
| blue | `--chart-stroke-blue` | `#5182C1` | 0.77 / 0.110 / 255° |
| orange | `--chart-stroke-orange` | `#AB7235` | 0.79 / 0.105 / 65° |
| violet | `--chart-stroke-violet` | `#8474B3` | 0.77 / 0.095 / 295° |
| teal | `--chart-stroke-teal` | `#4A9073` | 0.78 / 0.085 / 165° |
| pink | `--chart-stroke-pink` | `#AB6983` | 0.79 / 0.090 / 355° |
| cyan | `--chart-stroke-cyan` | `#458C9C` | 0.79 / 0.075 / 215° |
| green | `--chart-stroke-green` | `#618D62` | 0.78 / 0.080 / 145° |
| purple | `--chart-stroke-purple` | `#9270AB` | 0.77 / 0.095 / 310° |

单系列图默认用 blue。2–4 系列优先核心四色；5–6 系列再引入 pink / cyan。超过六个系列优先直接标注、分面或按业务需要汇总“其他”，避免继续添加近似色。汇总不适用于必须分别识别的路由，应拆分视图或保留每条路由标签。

teal / cyan、blue / cyan 仍可能在小色块或低透明度下难以区分。cyan 放在扩展末位，三者不作为默认三系列组合；相邻堆叠段避免这些组合，必要时调整视觉顺序并保留直接标签。线图同时使用线型或点形，不能宣称这套色盘单靠颜色即可覆盖所有色觉差异。

不把 red、amber、yellow、lime、indigo 放入默认六色：前两者容易与告警语义竞争，yellow / lime 在浅色承载面上较弱，indigo 与 blue / violet 接近。已有调用可继续支持这些名字，不能直接删除公共 `BadgeColor` 输入。

## 3. 分类、状态与中性结构

| 层 | 使用方式 | 规则 |
| --- | --- | --- |
| 分类面积 | `--chart-category-*` | 模型、服务、费用项、供应商等稳定身份；orange 不等于警告，green 不等于成功 |
| 分类细线 / 小标记 | `--chart-stroke-*` | 同一分类色相的深阶；用于细线、图例 dot、节点、散点等需清晰辨识的标记 |
| 状态 | 现有 `chartStatusColors` | success → `--fg-success`；warning → `--fg-warning`；danger → `--fg-danger`；info → `--fg-info`；neutral → `--fg-neutral-status` |
| 轨道 / 剩余容量 | `--muted` | 保留容量背景；未知数据必须另有文字或纹理说明，不能与“剩余容量”混为同一种含义 |
| 轴 / 次要标签 | `--fg-subtle` | 保留中性文字，不按分类着色 |
| 数值 / 主要标签 | `--fg-default` | 金额、请求数、占比使用中性文字；颜色只放在图形和图例标记 |
| 网格 / 边界 | `--border` 或 `--border-subtle` | 低强调结构，不用分类色描边 |

品牌颜色可被用户自定义。数据分类色不随品牌主题变化，避免品牌更换后整张多系列图都变为同一色相。单独显示警告、失败等情况时，通过独立状态标记、注释或阈值线表达，保留数据系列的原分类色。

## 4. 同一色相的绘制层次

| 图形用途 | 推荐规则 | 当前项目依据 |
| --- | --- | --- |
| 堆叠条、柱、大面积色块 | `--chart-category-*` 100%；紧凑条需配可读图例或直接标签 | 保留三个模块面积图形，改为浅色填充阶 |
| 趋势线、端点、节点、图例 dot | `--chart-stroke-*` 100%；趋势线约 2px | 基于现有绘制新增同色相深阶 |
| Area 填充 | `--chart-category-*`；12% 为初始候选，需在浅色承载面调整到可见 | `TimeSeriesChart` 当前 fillOpacity 为 0.12；新填充阶更浅，不可原样假定可读 |
| Router 基础线 | `--chart-stroke-*` 30%，2px | 保留现有基础线透明度；仅为辅助连接层 |
| Router 晕层 | `--chart-stroke-*` 8%，5px，仅作辅助层 | 保留现有晕层透明度 |
| Router 粒子头 | `--chart-stroke-*` 90% | 保留现有粒子头透明度 |
| 非当前路由 | 当前项目整体 opacity 40% | `RouterFlow` 现有交互；这是弱化层，不是另一种分类色 |

8% / 12% / 30% 的颜色是辅助层，其对比度会显著下降。路由的关键识别保留实色端点与可读标签；关闭动画时仍应能读取路由。若连线路径本身必须清楚可辨，需要提高主线不透明度并在实际承载面检查，不能仅依赖粒子或晕层。

Hover 维持原色相，可提高线宽、增加端点或弱化其他系列；不要临时把 orange 换成 blue。文字和数值不随 Hover 换成高饱和分类色。

## 5. 对比度核对

按 sRGB 相对亮度公式分别计算不透明面积填充和深阶标记与项目实际承载面的对比度。浅色检查 `#FFFFFF`、`#F6F8FB`、`#F0F3F8`；深色检查 `#1B1B1B`、`#1F1F1F`、`#292929`、`#404040`。以下是各主题检查集合中的最低值。

| 分类 | 浅色面积填充最低对比度 | 浅色深阶标记最低对比度 | 深色最低对比度 |
| --- | --- | --- | --- |
| blue | 1.87:1 | 3.55:1 | 4.08:1 |
| orange | 1.78:1 | 3.64:1 | 4.58:1 |
| violet | 1.92:1 | 3.68:1 | 3.81:1 |
| teal | 1.73:1 | 3.42:1 | 5.57:1 |
| pink | 1.81:1 | 3.72:1 | 3.91:1 |
| cyan | 1.70:1 | 3.44:1 | 5.74:1 |
| green | 1.75:1 | 3.44:1 | 5.95:1 |
| purple | 1.93:1 | 3.68:1 | 3.92:1 |

深阶标记与上述浅色背景均超过 3:1。面积填充刻意提高明度，其与背景对比度不足 3:1；必须通过可读标签、图例以及必要的深阶标记提供辨识。不能把浅填充用于唯一传达信息的小图形或细线。这项检查不覆盖相邻分类之间的辨识度、透明填充、抗锯齿细线、文字或所有可访问性要求。

## 6. 对三个模块的建议映射

- **Credit**：保留 blue、orange、violet、green、cyan 的模型映射；容量条使用 `--chart-category-*`，模型列表可补 `--chart-stroke-*` dot，使 Logo 之外也能对应分段条。
- **Cost**：保留 Ingest / Storage / Queries 映射；Seats 初次迁移保留兼容 purple。费用条和 Slider 填充使用 `--chart-category-*`，Badge dot 使用 `--chart-stroke-*`；以同一分类映射保持色相一致。
- **Router**：保留现有路由对应色；Haiku 初次迁移保留兼容 purple。占比条用 `--chart-category-*`；表格 dot、端点、线和粒子用 `--chart-stroke-*`，继续保留当前透明度层次。

这三个示例并不是同一组模型或同一套业务分类，不应按展示序号强制共享映射。只有宿主确认实体相同，才使用同一规范化业务 ID 和色名。供应商品牌 Logo 不参与系列配色分配。

## 7. 建议落地边界

以下 CSS 仅为建议，尚未加入项目。`light-dark()` 依赖项目已有 color-scheme 主题切换：

```css
--chart-category-blue: light-dark(#84B7F9, #60A5FA);
--chart-category-orange: light-dark(#E9AC70, #FB923C);
--chart-category-violet: light-dark(#B8A8EB, #A78BFA);
--chart-category-teal: light-dark(#82C9AA, #2DD4BF);
--chart-category-pink: light-dark(#E9A3BD, #F472B6);
--chart-category-cyan: light-dark(#81C7D9, #22D3EE);
--chart-category-green: light-dark(#98C598, #4ADE80);
--chart-category-purple: light-dark(#C7A3E2, #C084FC);

--chart-stroke-blue: light-dark(#5182C1, #60A5FA);
--chart-stroke-orange: light-dark(#AB7235, #FB923C);
--chart-stroke-violet: light-dark(#8474B3, #A78BFA);
--chart-stroke-teal: light-dark(#4A9073, #2DD4BF);
--chart-stroke-pink: light-dark(#AB6983, #F472B6);
--chart-stroke-cyan: light-dark(#458C9C, #22D3EE);
--chart-stroke-green: light-dark(#618D62, #4ADE80);
--chart-stroke-purple: light-dark(#9270AB, #C084FC);
```

保持现有 `ChartConfig.color`、`VisualizationSegment.color` 和 route / model 的色名输入方式。消费者按绘制用途把色名解析为 `var(--chart-category-*)` 或 `var(--chart-stroke-*)`；现有 Chart 和 SVG 都能读取 CSS 颜色字符串，不需要创建新的图表引擎。`TimeSeriesChart` 当前让 Area 的 fill / stroke 共享 `--color-seriesN`，正式接入时需在绘制层区分两阶，或显式配置配对的填充 Token，不可假设只替换配置字符串就完成。

不要修改 `badgeColors` 的返回值来完成迁移，这会同时改变大量非图表消费者。Chart 图例中的 Badge dot 应使用公开 `BadgeCustomColor` 的 dot / base 自定义入口读取深阶，图表色盘与通用 Badge 色盘的使用范围保持明确。Badge 本身的文字、背景和 onStrong / onSoft 配对仍按其现有契约提供。

正式实施应修改手工维护的 [semantic-tokens.mjs](../../packages/ui/src/tokens/semantic-tokens.mjs)，经现有生成流程更新 CSS、`@zeron/tokens`、Registry 和文档；生成产物不可直接手改。

特别注意：直接改变 `chartCategoricalColors` 的长度或顺序，会使现有哈希 ID 映射整体改变。迁移前固定既有业务的 ID → 色名；缺少业务映射时继续保留原哈希顺序或显式采用新版本色盘。稳定哈希不能保证同图唯一颜色，需要消费者对同屏分类显式分配并持久化映射。

验收范围：三个模块浅深主题；图表、图例和控件是否沿用同一分类色相，面积 / 标记两阶是否正确；浅色色块与项目品牌蓝并排是否协调；筛选、重排、跨周期颜色是否稳定；Router 静态及减少动态效果；剩余容量与未知值是否可区分；Registry 安装后 token 是否实际存在。
