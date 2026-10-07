---
schema_version: 1
name: chart-motion
kind: component
status: stable
locale: zh-CN
summary: FunnelChart 与时间序列图共享的入场动画依赖。
source: packages/ui/src/components/chart-motion.tsx
package_import: "@zeron/ui/chart-motion"
registry_import: "@/components/ui/chart-motion"
registry: packages/ui/registry.json
typecheck_examples: false
related: [area-chart, chart-core, chart-brush, funnel-chart]
---

# chart-motion

Registry 的单一共享文件所有者，包含 animation、use-mount-progress、use-enter-complete，由 FunnelChart 和 chart-core 自动安装。FunnelChart 仍只依赖 Motion/surfaces/utils，不经 chart-core 引入 Visx。公共入口导出默认 transition、duration、easing 和 clipRevealTransition；业务页面使用 chart 组件，不直接调用内部 hooks。

默认 tween=1.1s，ease=[.85,0,.15,1]。SVG clip 的宽度采用 tween；自定义 spring 输入转为 tween，避免 SVG 裁剪属性的 spring 越界。保留停止动画、重播与卸载清理。
