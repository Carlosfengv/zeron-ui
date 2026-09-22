---
schema_version: 1
name: code-block
kind: component
status: stable
summary: 展示代码、差异、Patch、合并冲突、流式输出和可编辑代码。
package_import: "@zeron/ui/code-block"
registry_import: "@/components/ui/code-block"
source: packages/ui/src/components/code-block/index.ts
registry: packages/ui/registry.json
related:
  - button
  - tabs
  - tooltip
---

# CodeBlock

## Agent intent

使用 CodeBlock 组件族展示精确保留原始空白和换行的代码内容。单文件使用 `CodeBlock`，新旧文件对比使用 `CodeDiff`，Git patch 使用 `CodePatch`，冲突文件使用 `CodeConflict`，大量文件使用 `CodeView`。

## Installation and imports

```bash
npx zeron-ui add code-block
```

```tsx
import { CodeBlock, CodeDiff } from "@/components/ui/code-block";
import { CodeStream } from "@/components/ui/code-block/stream";
import { CodeEditProvider } from "@/components/ui/code-block/edit";
import { CodeWorkerProvider } from "@/components/ui/code-block/worker";
```

服务端预加载从 `@/components/ui/code-block/server` 导入，解析与变更应用从 `@/lib/code-engine/core` 导入。不要从内部目录导入未公开模块。

## Core rules

- `file.contents` 是原始数据，不要 trim、格式化或从渲染后的 DOM 反向读取。
- `appearance="zeron"` 是默认产品外观；需要仅使用引擎基础样式时可设置 `appearance="engine"`。
- `toolbar` 默认开启，提供原文复制和 scroll/wrap 切换。通过 `messages` 本地化按钮文本。
- `selectedLines` 使用从 1 开始的源码行号。受控选区由调用方保存。
- `CodeDiff` 传 `oldFile` 与 `newFile`，或传已经解析的 `fileDiff`，不要同时混用两组输入。
- `CodePatch` 接受 patch 字符串；无效 patch 的业务提示应由调用方结合错误边界呈现。
- 大列表使用 `CodeView` 的稳定 item id/version，不要把全部文件手工映射成独立 CodeBlock。

## Worker, streaming, and SSR

只读 CodeBlock 可以独立运行。多个代码表面需要并发高亮时，在页面局部挂载一个 `CodeWorkerProvider`；不同 Provider 的 Worker 池和配置彼此隔离。

React 严格模式会重挂载 effect，因此 `CodeStream` 应传流工厂：

```tsx
<CodeStream
  source={() => new ReadableStream({
    start(controller) {
      controller.enqueue("export const ready = true;\n");
      controller.close();
    },
  })}
  options={{ lang: "typescript" }}
/>
```

传入现成 `ReadableStream` 只适合确定不会重挂载的生命周期。切换数据时创建新流，旧流会在清理阶段取消。

服务端页面可先调用 `preloadCode`，再把返回的 `file`、`options` 和 `prerenderedHTML` 传给客户端 CodeBlock。预渲染 HTML 只使用本地渲染器生成的可信结果，不接受任意用户 HTML。

## Editing

编辑区域必须位于 `CodeEditProvider` 下，并显式传 `edit`。`onEditChange` 用于保存草稿，不要把每次输入立即写回 `file` 造成编辑器重置。`onEditComplete` 返回 `"accept"` 或 `"reject"`；未提供完成回调时按拒绝处理。Diff 编辑只作用于新文件一侧。

```tsx
<CodeEditProvider>
  <CodeBlock
    file={file}
    edit={editing}
    editStateKey={file.id}
    onEditChange={(event) => saveDraft(event)}
    onEditComplete={() => "accept"}
  />
</CodeEditProvider>
```

## Accessibility and safety

- 保留工具栏按钮的可访问名称和焦点样式。
- 增删状态同时具有行标识和颜色，不要只依赖色块表达变化。
- 文件名、代码、Patch 和错误文本都按普通文本处理。
- 在窄屏优先使用 wrap，或保留明确可操作的横向滚动。
- 编辑时验证输入法组合、撤销重做、查找替换和宿主快捷键不会冲突。

## Verification checklist

- [ ] 原文首尾空白、空文件和末尾换行保持不变。
- [ ] 明暗主题、语法语言和未知语言降级可读。
- [ ] copy 成功后才显示成功反馈，失败会触发 `onCopyError`。
- [ ] Diff/Patch 的增删内容、行号和布局符合输入数据。
- [ ] Worker 在消费项目中实际创建并返回结果，卸载 Provider 后终止。
- [ ] Stream 使用可重建的数据源并验证 close/abort。
- [ ] SSR 首屏已有内容，hydration 没有重复节点或 mismatch。
- [ ] 编辑 accept/reject、IME、undo/redo 与会话保留经过真实浏览器验证。

完整类型以 `source` 指向的实现为准。
