# Member Department 01 集成方案

## 1. 结论

建议新增一个 React `data-block`：`member-department-01`，用于承载“成员与部门”页面的业务工作区。

Block 只负责 Figma 中右侧的页面标题、视图切换、筛选工具栏、部门树和成员表格，不复制 280px 的全局管理后台 Sidebar。宿主应用继续负责 `AppShell`、一级导航、账号菜单和路由；Block 从 `PageLayout` 开始渲染。这样既能放回当前 Zentrix 管理后台，也能安装到已有其他 shell 的项目中，不会产生双重 Sidebar、重复主导航或两个滚动容器。

首版验收范围以 Figma 当前展示的“成员”视图为准：

- 完整实现成员搜索、账号状态筛选、部门树筛选、分页、添加成员入口和部门操作入口；
- “部门”和“已离职成员”保留为后续视图契约，不根据当前单张设计稿臆造字段和操作；
- mock 数据与交互由文档预览层提供，Block 本身不伪造创建、编辑、删除成功；
- 只使用当前仓库已经存在的组件、图标槽和语义变量，不新增 UI primitive、图标包、颜色 token 或全局样式。

设计来源：[Figma 3249:10619](https://www.figma.com/design/hPcqRTLq6eEpcY5lpomkGl/ZClaw?node-id=3249-10619&m=dev)。

## 2. Figma 基线

完整画布为 `1728 × 1117px`，其中：

- 全局 Sidebar：`280px`，属于宿主 shell，不进入 Block；
- 主区域：`1448px`；外边距 `12px`；
- 页面标题条：`32px` 高；
- 工作区表面：`1424 × 1053px`，圆角 `16px`；
- Tabs 区域：`56px` 高，内边距 `12px`；
- 工具栏控件：`32px` 高，搜索框 `450px`，控件间距 `12px`；
- 主内容为 `320px + 12px + minmax(0, 1fr)` 的两列结构；
- 部门面板：`320px`；成员表格：设计基线 `1068px`；
- 表头：`36px`；成员行：`56px`；
- 表格列依次为姓名、职能组、手机号码、状态、部门；姓名列约 `360px`，其余列约 `171px`；
- 默认分页大小为 10，分页位于表格底部。

Figma 的主要视觉变量与仓库现有 token 已高度一致：`#f6f8fb`、白色浮动表面、`rgba(52,57,71,.12)` 边框、`#0060d2` 品牌色、14/20 正文和 12/16 辅助文字均已有直接语义映射。

## 3. 集成边界

```text
宿主应用（已有，不由 Block 创建）
└─ AppShell / Sidebar / 账号菜单 / 路由
   └─ member-department-01
      └─ PageLayout
         ├─ PageHeader：成员与部门
         └─ PageContent
            ├─ PageContentHeader：Tabs
            └─ PageBody
               ├─ 成员筛选工具栏
               └─ 成员工作区
                  ├─ DepartmentPanel
                  │  └─ MemberTree
                  └─ MemberDataTable
                     └─ DataTable + DataTablePagination
```

不建议把 Figma 左侧全局导航一起放进 Block，原因如下：

1. 它包含概览、技能、应用连接、模型服务、审批、审计等页面级产品导航，不是成员管理本身的公共能力。
2. 当前仓库的 `AppShell`、`Sidebar` 和移动抽屉已经拥有响应式及 landmark 语义，Block 内再创建一套会造成布局与可访问性冲突。
3. Block 安装到消费项目时，导航项、路由和账号上下文几乎一定需要被替换；把它们固化在数据 Block 中会扩大适配面。
4. 完整页面预览如需还原 Figma，可在 docs preview 外层复用现有 shell recipe，但该 wrapper 不应成为 Block 的安装契约。

## 4. 组件映射

| Figma 区域 | 当前项目组件 | 建议用法 | 说明 |
| --- | --- | --- | --- |
| 主页面布局 | `PageLayout` | `size="full"`、默认 `12px` gutter | 不创建第二个 `AppShell` |
| 页面标题 | `PageHeader` + `PageHeaderContent` + `PageTitle` | `useIcon("users")` + “成员与部门” | 标题属于页面层，不放进 Tabs |
| 白色工作区 | `PageContent` | `rounded-2xl`，保持 `border-border bg-surface-floating` | 对齐 Figma 16px 圆角 |
| 视图切换 | `Tabs` + `TabsList` + `TabItem` | `variant="pill" color="neutral"` | 活跃项为中性高对比面；成员 Tab 使用 `useIcon("user")` |
| 搜索 | `InputGroup` + `InputGroupAddon` + `InputGroupInput` | `size="md"`，前置 `useIcon("search")` | 对齐 32px 控件和 450px 桌面宽度 |
| 账号状态筛选 | `DataTableFacetedFilter` | 单选或多选状态，默认虚线低强调 | 直接复用现有 DataTable 列过滤契约 |
| 添加成员 | `Button` | `variant="neutral" size="md"` | 当前区域唯一高强调操作；无回调时不显示 |
| 部门面板外框 | 业务 `section` + 语义 token | `rounded-xl border-border bg-surface-floating` | 普通内容编排，不新增 Card/Container primitive |
| 新建部门 | `Button` | `variant="tertiary" size="md" className="w-full"` | 有边界的次级动作；无回调时不显示 |
| 组织树 | `MemberTree` | `selectionMode="single"`、`selectableTypes={["department"]}`、`density="regular"` | 复用展开、焦点、选择、搜索和键盘行为 |
| 部门人数 | `Badge` | `size="sm" color="gray"`，放在 `renderTrailing` | 不手写计数胶囊 |
| 部门 More | `Button` + `DropdownMenu` + `MenuItem` | `iconOnly size="xs" variant="ghost"`，放在 `renderActions` | 图标来自 `useIcon("ellipsis")`；不让操作冒泡为行选择 |
| 展开箭头 | `MemberTree` 内部 Tree | 使用现有 `useIcon("chevron-right")` 和旋转动画 | 不手写 ArrowDown/ArrowRight SVG |
| 成员表格 | `DataTable` + `useDataTable` | 5 个业务列，分页大小 10 | 搜索、过滤、分页共享同一个 TanStack row model |
| 姓名单元格 | `AvatarWithDetails` + `Avatar` + `AvatarImage` + `AvatarFallback` | 头像旁已有姓名时图片 `alt=""` | 图片失败时保留姓名首字母回退 |
| 状态 | `Badge` | `status="success"` / `warning` / `danger` / `neutral` | 状态不能只依赖颜色，始终显示文字 |
| 分页 | `DataTablePagination` | `pageSizeOptions={[10, 20, 50]}` | 当前组件的英文文案与 Figma 一致 |
| 小屏部门选择 | `MobileDrawer` + `Button` | `lg` 以下把常驻树移入抽屉 | 避免树与宽表上下堆叠形成超长页面 |
| 空、加载和错误 | `Empty` / DataTable loading API / `InlineNotice` | 分别处理无数据、骨架和可重试错误 | 不用空白表格冒充状态 |

### 为什么使用 MemberTree，而不是复制 Figma 的树行

`MemberTree` 已经覆盖稳定 key、展开状态、单选/多选、搜索祖先展开、方向键导航、焦点恢复和行操作隔离。当前页面只需把业务部门数据转换为 `OrganizationNode`，通过 `renderTrailing` 显示人数，通过 `renderActions` 显示 More 菜单。

唯一预期视觉差异是根组织的 “Z” 方形标记：`MemberTree` 当前固定使用成员/部门图标槽，不开放 `renderIcon`。首版建议接受现有 `users` 图标，保持公共组件契约；不要复制 Tree 或从祖先 CSS 改写内部 slot。只有根组织品牌标记被确认是跨业务的硬需求时，再单独评估为 `MemberTree` 增加公开图标能力。

## 5. Token 映射

| Figma 变量/值 | Zeron 语义实现 |
| --- | --- |
| `Background/--background-2 #f6f8fb` | `bg-surface-base` |
| `Background/--background-1` / `--card` | `bg-surface-floating` |
| `Border/--border rgba(52,57,71,.12)` | `border-border`；弱分隔使用 `border-border-subtle` |
| `Fill/--fill-1` | hover 使用 `bg-hover`，选中使用 `bg-selection` |
| `Text/--foreground` | `text-fg-default` |
| `Text/--secondary-foreground` | `text-fg-muted` |
| `Text/--muted-foreground` | `text-fg-subtle` |
| `Brand/600 #0060d2` | `bg-brand` / `text-fg-brand` |
| 品牌色上的文字 | `text-fg-on-brand` |
| 黑色主操作 | `Button variant="neutral"`，不手写黑色背景 |
| 14/20 文本 | `text-body` |
| 12/16 文本 | `text-label` |
| 32px 控件 | `size="md"` / `h-control-md` |
| 20px Badge | `Badge size="sm"` |
| 8px / 12px / 16px 圆角 | `rounded-lg` / `rounded-xl` / `rounded-2xl` |
| `shadow-sm` | 使用 Button、Input 等组件自带的 `shadow-control`，不重复叠加 |

字体继续使用项目的 `Inter, system-ui, sans-serif`。不为还原 Figma 的 PingFang SC / Geist Mono 单独加载字体；中文由系统 fallback 处理，数字仅使用 `tabular-nums` 保持对齐。

## 6. Block 对外契约

建议拆成类型、demo 数据和组件三个文件。核心类型如下：

```ts
export type MemberDepartmentView = "members" | "departments" | "departed";

export type MemberAccountStatus =
  | "active"
  | "invited"
  | "suspended"
  | "departed";

export interface MemberDepartmentRecord {
  id: string;
  name: string;
  parentId?: string;
  memberCount: number;
  children?: readonly MemberDepartmentRecord[];
}

export interface MemberDirectoryRecord {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  functionGroup: string;
  phone: string;
  status: MemberAccountStatus;
  departmentId: string;
  departmentPath: string;
  leftAt?: string;
}

export interface MemberDepartmentData {
  departments: readonly MemberDepartmentRecord[];
  members: readonly MemberDirectoryRecord[];
}

export type DepartmentAction = "add-child" | "rename" | "move" | "delete";

export interface MemberDepartmentActions {
  onCreateMember?: () => void | Promise<void>;
  onCreateDepartment?: (parentDepartmentId?: string) => void | Promise<void>;
  onDepartmentAction?: (
    department: MemberDepartmentRecord,
    action: DepartmentAction
  ) => void | Promise<void>;
  onMemberOpen?: (member: MemberDirectoryRecord) => void;
}

export interface MemberDepartmentBlockProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "children"> {
  data?: MemberDepartmentData;
  actions?: MemberDepartmentActions;
  labels?: Partial<MemberDepartmentLabels>;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  view?: MemberDepartmentView;
  defaultView?: MemberDepartmentView;
  onViewChange?: (view: MemberDepartmentView) => void;
  selectedDepartmentId?: string;
  defaultSelectedDepartmentId?: string;
  onSelectedDepartmentChange?: (departmentId: string) => void;
}
```

契约规则：

- `data` 未传时使用 `memberDepartmentDemoData`，但 action 不提供默认成功行为；
- 创建、编辑、移动、删除入口仅在相应 callback 存在时显示；
- `view` 和 `selectedDepartmentId` 支持受控与非受控两种模式；
- 所有 React key 使用稳定业务 ID，不使用数组下标；
- `memberCount` 是服务端或 mock 数据提供的部门全量统计，不根据当前分页成员反推；
- 选择父部门时默认包含所有后代部门成员；选择根组织时显示全部成员；
- 搜索字段覆盖姓名、邮箱、手机号、职能组和部门路径；
- 筛选顺序固定为：视图状态 → 部门子树 → 搜索词 → 账号状态 → 分页；
- 部门、搜索和状态变化后将页码重置为第一页；
- `departed` 记录必须带 `leftAt`；活跃成员视图默认排除 `departed`。

## 7. 视图范围

当前 Figma 只定义了 `members` 的内容和交互，因此首版实现遵循以下边界：

- `members`：完整内建视图，也是默认值；
- `departments`：暂不内建未经设计确认的多列表格和字段；
- `departed`：暂不内建离职原因、时间、重新激活等未经确认的操作。

为了避免可点击的空 Tab，首版组件应只渲染已提供内容的视图。推荐增加一个轻量的 `enabledViews` 或 `renderView` 契约，但不要同时引入两套扩展方式。更小的首版做法是只渲染成员 Tab，并在取得另两个 Figma 节点后一次性补齐 `MemberDepartmentView`；文档预览和验收不得把空白或 no-op 面板当作完成状态。

推荐选择：首版只交付成员视图，但保留上述三值类型，后续新增视图不破坏数据模型。

## 8. Mock 数据方案

文件建议为 `member-department-demo-data.ts`，导出 `memberDepartmentDemoData`。Mock 应覆盖真实 UI 状态，而不是复制 10 行相同的 Carlos：

### 部门树

```text
组织结构（13）
├─ 研发中心（8）
│  ├─ 平台组（2）
│  ├─ 测试组（2）
│  ├─ 前端组（2）
│  └─ 后端组（2）
├─ 总裁办（1）
├─ 人力资源（1）
├─ 财务（1）
├─ 国际销售（1）
└─ 国内销售（1）
```

### 成员样本

| 姓名 | 邮箱 | 职能组 | 状态 | 部门 |
| --- | --- | --- | --- | --- |
| Carlos Wei | carlos.wei@zentrix.example | 用户体验 | active | 研发中心 / 平台组 |
| Dou Shangmin | shangmin.dou@zentrix.example | 研发 | active | 研发中心 / 平台组 |
| Wang Chenglong | chenglong.wang@zentrix.example | 自动化测试 | active | 研发中心 / 测试组 |
| Liu Siya | siya.liu@zentrix.example | 质量保障 | invited | 研发中心 / 测试组 |
| Zhou Rui | rui.zhou@zentrix.example | Web 前端 | active | 研发中心 / 前端组 |
| Lin Yue | yue.lin@zentrix.example | 设计系统 | active | 研发中心 / 前端组 |
| Chen Mo | mo.chen@zentrix.example | 平台后端 | active | 研发中心 / 后端组 |
| Xu Yan | yan.xu@zentrix.example | 数据工程 | suspended | 研发中心 / 后端组 |
| Tang Qi | qi.tang@zentrix.example | 战略运营 | active | 总裁办 |
| Zhao Ning | ning.zhao@zentrix.example | 招聘 | active | 人力资源 |
| Wu Fan | fan.wu@zentrix.example | 财务分析 | active | 财务 |
| Sun Hao | hao.sun@zentrix.example | 国际销售 | active | 国际销售 |
| He Jing | jing.he@zentrix.example | 国内销售 | departed | 国内销售 |

手机号使用明显的示例号，例如 `+86 138 0000 0001`，避免看起来像真实个人数据。`He Jing` 提供 `leftAt`，用于后续离职成员视图。

头像策略：

- 仅使用仓库已有的 `/sample-avatar.png`、`/figma/nav-menu-agent-avatar.png` 和 `/figma/zstack-account-menu/avatar.jpeg` 作为少量样本；
- 其余成员故意不传 `avatarUrl`，验证 `AvatarFallback`；
- 不直接引用 Figma MCP 返回的临时头像 URL，它们约 7 天后失效；
- 每个 Avatar 同时包含 `AvatarImage` 和 `AvatarFallback`。

## 9. 状态与交互

### 成员筛选

- 搜索词使用本地受控 state，并通过一个自定义 TanStack `filterFn` 匹配多个字段；
- 账号状态使用 `DataTableFacetedFilter`，默认无筛选；
- 部门选择使用受控 `MemberTree.selectedKeys`，始终最多一个 key；
- 父部门筛选通过一次性构建的 `departmentId -> descendantIds` Map 完成，避免每行递归遍历；
- 过滤结果改变时重置 DataTable pagination，但保留部门展开状态。

### 部门操作

- `renderTrailing` 只显示 `Badge` 人数；
- `renderActions` 只在 `onDepartmentAction` 存在时渲染 More；
- 菜单项为新增子部门、重命名、移动、删除；
- 删除属于危险动作，菜单文案必须明确，最终确认应由宿主 Dialog 或业务流程承担；
- Block 只上报 intent，不本地假装服务端操作成功。

### 成员操作

- “添加成员”只在 `onCreateMember` 存在时显示；
- 表格行如需打开详情，通过 `onMemberOpen` 提供，不在行内叠加不可见 Button；
- Figma 当前没有成员行 More 列，首版不新增。

## 10. 响应式与滚动

### 桌面 `lg` 及以上

- 保持 `320px + 12px + minmax(0, 1fr)`；
- 姓名列固定/置左，其他列允许横向滚动；
- 搜索框最大宽度 `450px`，添加成员靠右；
- 左侧部门面板可在页面滚动时保持顶部可见，但不创建第二个页面级滚动区。

### 小于 `lg`

- 不把完整树直接堆在表格上方；使用 `MobileDrawer` 打开部门选择；
- 工具栏换行：搜索占满一行，状态筛选和添加成员位于下一行；
- Tabs 使用现有横向溢出能力；
- DataTable 保持至少约 `900px` 的内容宽度并横向滚动，不把 5 列压成不可读窄列；
- 分页由 `DataTablePagination` 自身切为纵向布局。

滚动所有权：宿主 `AppShellMain` 约束高度，`PageContent` 隐藏外溢，`PageBody` 是页面主纵向滚动区；DataTable 只拥有横向滚动，MobileDrawer 拥有独立 overlay 滚动。不得再给整个 Block 根节点添加 `overflow-auto`。

## 11. 数据与异常状态

必须覆盖以下状态：

- `loading=true`：部门树保留结构时显示只读/加载状态，表格使用 DataTable loading skeleton；
- 首次加载且无数据：显示完整 Skeleton，不显示“暂无成员”；
- `error`：工作区顶部显示 `InlineNotice tone="danger"`，有 `onRetry` 时提供重试；
- 部门为空：DepartmentPanel 显示 `Empty`，创建按钮仅在有权限时出现；
- 成员全局为空：显示成员 onboarding empty state；
- 搜索/筛选结果为空：显示 filter empty state，并允许清除过滤；
- 无权限：对应 action callback 不传，界面中不渲染按钮或菜单；
- 长姓名、邮箱、部门路径：单行截断并保留可访问的完整文本或 `title`；
- Avatar 加载失败：显示 fallback；
- 数据中出现未知 departmentId：成员仍显示，部门列回退为传入的 `departmentPath`，同时在开发环境给出可诊断警告。

## 12. 文件落点

### Block 源码

- `packages/blocks/src/application/member-department-01/member-department.tsx`
- `packages/blocks/src/application/member-department-01/member-department-types.ts`
- `packages/blocks/src/application/member-department-01/member-department-demo-data.ts`
- `packages/blocks/src/application/member-department-01/index.ts`
- `packages/blocks/src/catalog.ts`
- `packages/blocks/block-capabilities.json`
- `packages/blocks/package.json`
- `packages/blocks/registry.json`

Registry 建议声明：

```json
{
  "framework": "react",
  "kind": "data-block",
  "dependencies": ["tw-animate-css", "@tanstack/react-table"],
  "registryDependencies": [
    "avatar",
    "badge",
    "button",
    "data-table",
    "dropdown",
    "empty",
    "icon-context",
    "inline-notice",
    "input-group",
    "member-tree",
    "menu-item",
    "mobile-drawer",
    "page-layout",
    "tabs",
    "utils"
  ]
}
```

### 文档与预览

- `docs/pages/blocks/member-department-01/page.tsx`
- `docs/pages/blocks/member-department-01/MemberDepartmentBlockDocClient.tsx`
- `docs/content/en/blocks/member-department-01.json`
- `docs/content/zh-CN/blocks/member-department-01.json`
- `docs/manifest.ts`
- `docs/components/blocks/standalone-blocks.ts`
- 对应生成的 page/block loader 文件

### 测试与生成产物

- `tests/member-department-contract.test.ts`
- `tests/member-department-interaction.test.tsx`
- `public/r/member-department-01.json`
- `public/r/registry.json`

公开 Registry 产物通过 `pnpm registry:build` 生成，不手写生成后的组件源码。

## 13. 实施顺序

1. 建立类型、labels、mock 数据与稳定 ID。
2. 用 `PageLayout` / `PageContent` / `Tabs` 完成页面结构。
3. 把部门数据转换为 `OrganizationNode[]`，接入 `MemberTree` 单选、人数和 More 菜单。
4. 建立成员 DataTable 列、跨字段搜索、状态筛选、部门子树筛选和分页。
5. 接入 Avatar fallback、Badge 状态及 action callback 显隐。
6. 添加 `MobileDrawer` 小屏部门选择，明确滚动所有权。
7. 补齐 loading、empty、filtered-empty、error、permission 和长文本状态。
8. 添加 package export、catalog、capability、Registry、docs 和双语内容。
9. 运行 Registry 构建并更新公开产物。
10. 完成单元、交互、类型、Lint、构建和 Figma 对照。

## 14. 验收标准

- Block 可通过 `@zeron/blocks/member-department-01` 导入并通过 Registry 安装；
- 不包含全局 Sidebar，不嵌套第二个 `AppShell`；
- 桌面主结构与 Figma 的 12px 间距、320px 左栏、32px 控件、36px 表头和 56px 数据行一致；
- 使用 `MemberTree`、`DataTable`、`Tabs`、`Avatar`、`Badge`、`Button`、`Dropdown` 和 `InputGroup`，不复制它们的内部交互；
- 源码不出现 Figma 原始十六进制颜色，不新增设计 token、图标包和全局 CSS；
- 搜索、状态、部门筛选可组合，并在条件变化时重置分页；
- 选择父部门包含其全部后代成员；人数不受当前分页影响；
- 无 callback 时不显示会产生 no-op 的创建/编辑/删除控件；
- 头像失败有 fallback；状态不只靠颜色表达；所有 icon-only Button 有 `aria-label`；
- 键盘可完成 Tabs 切换、Tree 导航/选择、菜单操作和分页；
- `375px` 小屏没有页面级横向溢出，表格横向滚动与部门抽屉可用；
- 亮色与暗色模式均使用语义 token，视觉和对比度可读；
- `pnpm --filter @zeron/blocks typecheck`、相关 Vitest、`pnpm lint`、`pnpm registry:build` 和 `pnpm build` 通过。

## 15. 已知差异与风险

1. Figma 头像为 36px、8px 圆角；当前 Avatar 仅提供 32px 或 40px，rounded 形态为 12px 圆角。建议首版使用 `size="lg" shape="rounded"` 或在高密度取 `size="default"`，不要用任意尺寸覆盖组件契约。视觉验收时优先比较信息密度而不是强行制造 36px 私有变体。
2. Figma 的“正常”状态是品牌蓝实底；Zeron 的语义状态 Badge 使用主题化状态色。建议使用 `status="success"`，接受颜色差异，避免把品牌色当作业务成功色。
3. `MemberTree` 不能替换根组织图标；首版接受 `users` 图标。若必须显示组织 Logo，应作为公共 API 缺口单独评估。
4. 当前 Figma 没有提供部门和已离职成员的内容节点。未经设计确认，不应假设字段、批量操作或恢复流程。
5. DataTablePagination 当前文案为英文，恰好匹配设计稿；如果产品最终要求中文，需要在 DataTable 公共层增加 labels 契约，不能在 Block 内复制分页组件。

## 16. Code Connect 状态

已确认的候选映射包括 `Button`、`Avatar`、`useIcon("user")`、`useIcon("ellipsis")`、`useIcon("chevron-down")`、`useIcon("chevron-right")`、`useIcon("brain")` 和 `useIcon("square-library")`。

Figma 在写入映射时返回 `Published component not found`，8 项均未生效。这表示当前仓库路径尚未对应 Figma 可识别的已发布 Code Connect component；它不影响本次 Block 实现。后续如需正式绑定，应先为公开组件建立可发布的 Code Connect 定义，再重新写入映射，不能把本次候选映射误报为已连接。

## 17. 非目标

- 不实现宿主后台的全局 Sidebar、账号菜单或真实路由；
- 不连接真实组织 API、权限系统或邀请服务；
- 不新增成员详情 Dialog、批量选择、批量转组或导入导出；
- 不修改 `MemberTree`、`DataTable`、`Avatar` 等公共 primitive；
- 不从单张成员视图推导部门管理和离职恢复流程；
- 不提交或长期引用 Figma MCP 的临时图片与 SVG URL。
