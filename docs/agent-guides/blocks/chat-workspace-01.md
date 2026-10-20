---
schema_version: 1
name: chat-workspace-01
kind: block
status: stable
locale: zh-CN
summary: 可拖拽的对话与内容工作区，独立 ArtifactPanel 支持代码审阅、Markdown、图片与网页预览。
package_import: "@zeron/blocks/chat-workspace-01"
registry_import: "@/components/blocks/chat-workspace-01"
source: packages/blocks/src/application/chat-workspace-01/chat-workspace.tsx
types: packages/blocks/src/application/chat-workspace-01/chat-workspace-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [chat-thread-01, resizable, code-block, markdown, tabs, scroll-area, file-type, input-message]
---

# Chat Workspace

安装 `npx zeron-ui add chat-workspace-01 input-message`。React 数据 Block，不依赖 Next.js 或 AI SDK。导出 ChatWorkspace、ArtifactPanel、ArtifactCard、getPendingReviewResources 和英文/中文 artifact labels。

第二期支持逐文件审阅、待审阅列表与前后循环跳转。底部只有一个审阅操作区，当前待审阅文件提供接受／拒绝，批量操作收入更多菜单。审阅仍通过 onReview(resource, decision) 提交具体版本；保存中禁止重复审阅，但可以切换预览。失败提示对应失败文件及其版本，不延续到新修订。不提供按变更块审阅、行级评论或代码编辑。

标签更多菜单始终可用（启用关闭时），列出全部打开资源，并支持关闭其他／全部标签。可选 onCloseMany(resources) 接收一次关闭的全部资源；提供时所有关闭均使用它，否则逐项调用 onClose。宿主只移除打开项，保留资源目录及待审阅状态。关闭当前项选择右侧邻项，再回退左侧；关闭所有项保留 addAction。图片支持适应窗口、原始尺寸、绝对缩放和鼠标拖动平移；触屏与键盘继续使用原生滚动。手动比例保持稳定，适应窗口模式随容器变化重新计算。

```tsx
"use client";
import { useState } from "react";
import { ChatWorkspace, ArtifactPanel, ArtifactCard, type ArtifactResource } from "@zeron/blocks/chat-workspace-01";
import { ChatAssistantMessage } from "@zeron/blocks/chat-thread-01";
import { InputMessage } from "@zeron/ui/input-message";

export function WorkspaceExample() {
  const [draft, setDraft] = useState("");
  const [activeId, setActiveId] = useState("guide");
  const [pane, setPane] = useState<"chat" | "artifacts">("chat");
  const resources: ArtifactResource[] = [{ id: "guide", version: "1", kind: "markdown", name: "README.md", content: "# Guide" }];
  return <div className="h-96">
    <ChatWorkspace locale="zh-CN" activePane={pane} onActivePaneChange={setPane}
      composer={<InputMessage layout="compact" value={draft} onValueChange={setDraft} />}
      artifacts={<ArtifactPanel locale="zh-CN" resources={resources} activeId={activeId} onActiveIdChange={setActiveId} />}>
      <ChatAssistantMessage id="reply" text="文档已生成。">
        <ArtifactCard resources={resources} locale="zh-CN" onOpen={(item) => { setActiveId(item.id); setPane("artifacts"); }} />
      </ChatAssistantMessage>
    </ChatWorkspace>
  </div>;
}
```

Registry 使用 `@/components/blocks/chat-workspace-01`、`@/components/blocks/chat-thread-01` 和 `@/components/ui/input-message`。ArtifactPanel 可单独放入受限高度容器，无需聊天 Provider。

## 布局与状态归属

ChatWorkspace 直接复用 ChatThread；composer、children、busy、历史、检查点和 labels 均为 ChatThread 原接口。外层 className 管理整个工作区尺寸，宿主提供受限高度。

title 使用 14px medium 的 `text-body font-medium`，长标题省略并保留完整 title。可用 headerActions 在右侧内容区开关旁加入宿主会话操作，窄屏同样保留；该插槽不会透传给 ChatThread。演示提供重命名、置顶／取消置顶、分享、复制会话文本和归档／取消归档；状态仅在本地，分享链接为 mock，不发布内容。复制通过浏览器剪贴板并反馈失败，重命名保留消息、预览与输入草稿。

会话菜单由文档端 `ChatWorkspaceSessionMenu` 单独组合；核心只提供 headerActions 插槽，不引入会话业务或菜单依赖。弹窗分别管理类型与开关，关闭动画保留原来的重命名／分享内容。图片失败后禁用缩放与拖动并释放指针捕获，重试并加载完成后恢复操作。标签完成测量后，即使操作按钮占满可用宽度也只保留活动项，其余仍通过更多菜单访问。

分栏使用公开 ResizablePanelGroup、ResizablePanel、ResizableHandle；默认 38% / 62%，chatMinSize="280px"、artifactMinSize="320px"。支持拖动、分隔线方向键及 onLayoutChanged。容器宽度小于 760px 时展示单面板；activePane / onActivePaneChange 选择 chat 或 artifacts，panelOpen / onPanelOpenChange 管理内容区开关，均有 default 对应值。开关与响应式切换不重挂载会话或输入区，返回桌面保留上次比例。

ArtifactPanel 的 resources 是当前打开的资源列表，id 唯一且稳定，version 随内容修订变化。kind 为 code、markdown、text、image、url 或 file。代码/Markdown 有 previousContent 时支持差异；Markdown 默认预览，代码默认差异或源码。显式 review="pending" 才启用变更审阅。普通文件显示 MIME、大小与下载入口，不承诺 Office/PDF 全文预览。

ArtifactCard 的资源行使用 InfoItem，通过 render 的原生 button 根元素保持整行点击与键盘打开预览。标题下方显示文件大小；通用 size 字段以字节为单位，优先使用有限的非负值，代码/Markdown/text 未提供时按当前内容的 UTF-8 字节数计算。图片等远程文件由宿主提供 size，不为读取大小额外请求资源；未知时省略大小。网页项的辅助文字显示 URL，并对长地址省略显示、保留完整 title。右侧继续显示审阅状态与箭头。

activeId / defaultActiveId / onActiveIdChange 管理选择；onClose 负责从宿主列表移除资源。标签使用 segment 圆角选中底板，关闭按钮与标签按钮并列。宽度不足时保留完整标签和当前项，其余收入更多菜单；菜单列出全部已打开资源并标记当前项，不显示横向滚动条。addAction 可放置宿主的加号资源选择菜单，空面板同样保留此入口。重复打开由宿主去重。关闭活动项选择邻近项；Delete 关闭当前聚焦标签。访问过的预览在打开期间保持挂载与阅读位置，关闭后释放；新 version 重置对应预览。renderPreview(resource) 返回 undefined 时回退内建视图，可接入 PDF、浏览器或业务预览器。

## 操作与失败

onReview(resource, decision) 接收 accept / reject。底部只显示一个审阅栏，包含当前文件操作与更多菜单中的批量操作。复用 Alert status="info" 的浅蓝背景、边框和 xl 圆角，外层 p-3 保留四周 12px 间距，按面板宽度换行而非依赖视口断点。宿主核对 id/version 并提交真实文件操作、更新资源 review 后再 resolve；失败 reject，Block 不虚构成功。批量操作逐项调用并保留部分失败；待处理期间禁用重复审阅。历史、分支和检查点恢复由宿主同时更新会话与资源；旧版本审阅不得作用于新内容。

onReference(resource) 将结构化资源引用加入宿主草稿，不自动发送。onRetry 处理资源 status="error"；status="loading" 显示加载提示。复制失败有反馈，图片加载失败可重试。Markdown 不启用原始 HTML；预览器对代码错误隔离，失效资源可重试。

资源由宿主移除时，非受控选择会落到剩余首项；之后重新加入旧资源不会自动抢回选择。关闭或修订会释放对应的访问记录，重新打开的非活动资源仍延迟到首次选中再加载。预览渲染出错后，可通过重试、切换视图或加载状态恢复；宿主变更实际内容时仍须更新 version。

`getPendingReviewResources(resources)` 按宿主顺序返回可审阅、已就绪且 review="pending" 的版本，与底部批量审阅的条件一致。演示对完整资源列表计算数量，通过 `InputMessage.header` 放入 ContainerHeader，显示「还有 N 项待审阅确认的内容」和箭头按钮；零项时传入 undefined 隐藏整个 header。点击箭头使用第一项资源 ID 去重打开、展开面板，在窄屏切换到 artifacts 并聚焦选中标签，不发送消息、不清空草稿。关闭标签不等于完成审阅，已关闭的待审阅内容仍计数并可重新打开。

URL 只支持 HTTP(S) 或相对地址的沙箱 iframe；图片和下载额外允许 blob。禁止 javascript/data 等可执行协议。沙箱不赋予 same-origin；网页可运行脚本、提交表单并外部打开，不能访问父页面 DOM。目标网站可能通过 CSP/X-Frame-Options 禁止内嵌，iframe load 不证明成功，始终提供外部打开。刷新仅重载对应网页，不实现跨域导航历史或内容读取。宿主通过 renderPreview 接入完整浏览器能力。

## 演示与验证

createChatWorkspaceDemoResources(locale, assetBase) 返回本地主题代码、Markdown、图片、网页与 ZIP 元数据。assetBase 默认 /demos/chat-workspace；消费项目替换地址或提供自己的资源。演示回复与审阅为本地模拟，不访问模型、不写磁盘。独立面板演示不依赖 ChatWorkspace。

工作区与 chat-thread-01 的文档演示共用 ChatDemoModelControls、ChatDemoContextControl 和 ChatDemoResponseContent，统一模型选择、附件入口、上下文用量、思考过程和 Markdown 输出。回复仍使用 ChatAssistantMessage 的 model、modelLogo、provider、metrics、stopped、onRetry 和 onFeedback，模型身份属于单条回复快照，切换选择器不会改写历史回复。流式结束后显示 TTFT、输入/输出 tokens 和耗时。模型与上下文仅复用固定演示数据；消费项目按需另装 model-selector-01、context-window-02 并连接真实数据。

验证拖动与键盘调宽、收起后 composer 身份、窄屏切换、关闭后重开、修订后的状态重置、批量部分失败、引用不自动发送、图片缩放、URL 刷新和失效协议、空/加载/失败状态，以及 Registry 依赖闭包。样式只做外部布局，保持 Zeron 组件的表面、焦点、控件尺寸与主题。
