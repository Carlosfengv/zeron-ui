export const ZERON_DESIGN_TASTE_RULES = {
  zh: [
    "画布宽度匹配任务：表单、个人设置、订阅账单、分步向导使用居中窄栏（PageLayout size=\"md\" 或 max-w-3xl）；高密度表格、监控大盘、双栏 AI 工作台使用全宽有界布局（PageLayout size=\"full\"）。",
    "严禁“框套框”视觉噪音：处于 PageContent（自带 floating 表面与圆角边框）内的主表格或列表外层不要再套 Card 或 Container；优先用 0.5px 细分割线（border-hairline）或留白分组。",
    "90-8-2 色彩克制配额：90% 面积用于中性表面，约 8% 用于高对比文字与图标，品牌色与状态色不超过 2% 面积；同一任务区最多 1 个 primary/neutral 高强调主按钮。",
    "首屏信息密度上限：单行并列 MetricCard ≤ 4 张；工具栏外露筛选器 ≤ 3 个，低频动作收纳进 Dropdown。",
    "控件尺寸与手感对齐：同行并排的 Input、Select、Button 保持相同 size；图标通过 useIcon 与 leadingIcon/trailingIcon 槽位传入，不手写裸 SVG。",
  ],
  en: [
    "Task-matched canvas width: use centered narrow layouts (PageLayout size=\"md\" or max-w-3xl) for forms, settings, billing, and wizards; use bounded full-width layouts (PageLayout size=\"full\") for dense tables, dashboards, and split AI workspaces.",
    "Zero box-in-box noise: never wrap a main table or list inside PageContent (already a floating surface) in an extra Card or Container; prefer 0.5px border-hairline dividers or whitespace.",
    "90-8-2 color restraint: 90% neutral 5-tier Surface hierarchy, 8% high-contrast text/icons, <=2% brand or status accents; at most 1 primary/neutral button per task region.",
    "First-screen density caps: <=4 MetricCards per row and <=3 visible toolbar filters; collapse secondary actions into a Dropdown.",
    "Control & motion alignment: adjacent Input, Select, and Button controls must share the same size; pass icons via useIcon to leadingIcon/trailingIcon slots instead of raw inline SVGs.",
  ],
};
