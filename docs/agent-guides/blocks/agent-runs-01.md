---
schema_version: 1
name: agent-runs-01
kind: block
status: stable
locale: zh-CN
summary: 项目运行用量，包含费用趋势、Agent 活动、模型分布和可展开的 Session 费用明细。
package_import: "@zeron/blocks/agent-runs-01"
registry_import: "@/components/blocks/agent-runs-01"
source: packages/blocks/src/application/agent-runs-01/agent-runs.tsx
types: packages/blocks/src/application/agent-runs-01/agent-runs-types.ts
registry: packages/blocks/registry.json
related: [area-chart, chart-core, chart-primitives, container, tabs, data-table, avatar, badge, button]
---

显示精度随数据范围调整：低于币种最小单位的非零费用保留最多四位有效数字，费用轴也保留小额刻度；这只影响显示，不改变原始费用与汇总。横轴在不足一分钟时显示时分秒、不足一天时显示时分，多日窗口显示日期。无效 locale 仅回退为 en-US，无效 timeZone 仅回退为 UTC，两者独立处理。

# Agent 运行用量

React data-block，无应用外壳。导出 AgentRuns、createAgentRunsDemoData、中英文 labels 和公开数据类型，适合嵌入项目详情、Agent 工作台和用量页面。

```tsx
import { AgentRuns, agentRunsZhLabels, type AgentRunsData } from "@/components/blocks/agent-runs-01";

export function ProjectRuns({ data, openSession }: {
  data: AgentRunsData;
  openSession: (id: string) => void;
}) {
  return <AgentRuns data={data} labels={agentRunsZhLabels} locale="zh-CN" timeZone="Asia/Shanghai"
    onOpenSession={run => openSession(run.id)} />;
}
```

data 包含项目标识与名称、currency、start/end（毫秒时间戳）、agents、models 和完整 runs。每个 Run 使用稳定 ID、触发指令、Agent / 模型引用、status、startedAt、endedAt 与 usage。四类 usage 为 input/output/cacheRead/cacheWrite，各含非负安全整数 tokens 和非负有限 cost，cost 为币种主要单位。usage=null 表示未上报，保持 —，不伪装成零费用。已上报用量必须有模型引用。running 的 endedAt=null，其他状态必须有结束时间；所有时间位于窗口内。Agent 与模型 colorIndex 使用固定的分类槽位 1–5；图形与图例共用颜色。无效引用、重复 ID、非法数值和逆序时间显示错误。

顶部指标、累计费用、分布、按天汇总和明细均由同一组 Session 派生。Agent 用时为各次运行时长相加，包含并发重叠；历时为窗口长度。缓存命中率为 cacheRead / (input + cacheRead)，不把输出或缓存写入混入分母。未上报数据与进行中记录附带合计范围说明。累计曲线在 Session 结束时记入已上报费用；进行中的已上报费用记在窗口末尾。相同时间的累计事件合并，单次费用保留独立记录。不暗示运行期间的精确实时计费。

mode 支持 cumulative / per-run，受控时由宿主更新；defaultMode 提供本地初值，onModeChange 通知变化。defaultExpandedRunId 指定初始明细；pageSize 设置初始每页 Session 数，默认为 6，限制在 1–100；宿主修改该值时重置到第一页。分页器允许本地切换每页数量。点击活动色条自动切换到对应页并展开，表格按宿主 timeZone 的开始日期分组，按开始时间倒序排列，组汇总为完整日期而非当前分页片段。DataTable / useDataTable 拥有完整记录模型、表头、记录行与内置分页器；startedAt 时间列通过原生 columnPinning 固定在左侧，表头与每行时间不参与横向滚动，其余列在局部滚动区域内移动。日期分组标题与当天汇总使用表格可视区域宽度，并固定在滚动区域左侧，横向滚动时保持可见。表格启用 stickyHeader，将内容区高度限制为 min(65dvh, 40rem)；内容区独立纵向滚动，表头固定在顶部，分页器保留在滚动区外。原生分页提供每页数量、页码、首页 / 末页和前后翻页。renderRowHeader 插入当前页的日期标题，renderExpandedRow 根据 expanded 状态渲染跨列明细，明细面板按表格可视宽度布局并固定在左侧，横向滚动时费用、缓存和状态信息保持完整可见，窄屏自动改为上下排列；标题与明细不计入 Session 分页数量。分页不截断数据或影响汇总。行内触发按钮支持 aria-expanded，未上报明细显示说明。可选 onOpenSession 接收完整记录，onClose 由宿主拥有；不存在无效的默认导航。data.id 变化重置本地状态。

原生 Zeron AreaChart 使用公共 Area / Grid / XAxis / YAxis / ChartTooltip / TooltipContent；累计费用采用阶梯线，单次费用采用折线和标记。ChartDataTable 保留全量事件，图表自身支持方向键 / Home / End / Escape。Agent 泳道使用同一时间域的业务区间布局，不另写绘图引擎；极短色条有最小可见宽度，键盘与 title 可读取真实时长。分布复用 SegmentedBar / ChartLegend；加载复用 Skeleton，错误复用 InlineNotice，空态复用 Empty。窄容器中指标与分布堆叠，Session 表格局部横向滚动。

state=ready/loading/error，errorMessage/onRetry 为宿主加载恢复接口。演示有 89 次运行，其中 1 个进行中、3 个取消，总费用 $183.07；所有金额由示例记录推导。示例模型名与金额仅为视觉演示，不代表真实模型、价格或服务状态。真实用量采集、计费、缓存节省算法和 Session 路由由宿主负责。
